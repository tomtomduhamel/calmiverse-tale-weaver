
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AudioFile {
  id: string;
  story_id: string;
  text_content: string;
  audio_url: string | null;
  status: 'pending' | 'processing' | 'ready' | 'error';
  webhook_id: string | null;
  file_size: number | null;
  duration: number | null;
  voice_id: string;
  created_at: string;
  updated_at: string;
}

interface N8nWebhookPayload {
  text: string;
  storyId: string;
  voiceId?: string;
  requestId: string;
}

const N8N_WEBHOOK_URL = 'https://n8n.srv856374.hstgr.cloud/webhook/d2d88f5d-78c0-49c1-83b8-096d4b21190c';
const TIMEOUT_DURATION = 120000; // 120 secondes timeout (pour textes longs)

export const useN8nAudioGeneration = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const { toast } = useToast();

  // Récupérer les fichiers audio pour une histoire
  const fetchAudioFiles = useCallback(async (storyId: string): Promise<AudioFile[]> => {
    try {
      const { data, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const files = data as AudioFile[];
      setAudioFiles(files);
      return files;
    } catch (error: any) {
      console.error('❌ [N8nAudio] Erreur récupération fichiers audio:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les fichiers audio",
        variant: "destructive"
      });
      return [];
    }
  }, [toast]);

  // Nettoyer les anciens fichiers bloqués
  const cleanupStuckFiles = useCallback(async (storyId: string) => {
    try {
      const cutoffTime = new Date(Date.now() - TIMEOUT_DURATION).toISOString();
      
      const { error } = await supabase
        .from('audio_files')
        .update({ 
          status: 'error',
          updated_at: new Date().toISOString()
        })
        .eq('story_id', storyId)
        .in('status', ['pending', 'processing'])
        .lt('created_at', cutoffTime);

      if (error) throw error;
      
      console.log('🧹 [N8nAudio] Nettoyage des fichiers bloqués terminé');
    } catch (error) {
      console.error('❌ [N8nAudio] Erreur nettoyage:', error);
    }
  }, []);

  // Vérifier périodiquement le statut des fichiers en cours
  const checkPendingFiles = useCallback(async (storyId: string) => {
    try {
      const { data: pendingFiles, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('story_id', storyId)
        .in('status', ['pending', 'processing']);

      if (error) throw error;

      // Vérifier si des fichiers ont été mis à jour
      let hasUpdates = false;
      for (const file of pendingFiles || []) {
        const { data: updatedFile, error: fetchError } = await supabase
          .from('audio_files')
          .select('*')
          .eq('id', file.id)
          .single();

        if (!fetchError && updatedFile && updatedFile.status !== file.status) {
          hasUpdates = true;
          console.log(`🔄 [N8nAudio] Fichier ${file.id} mis à jour: ${file.status} → ${updatedFile.status}`);
        }
      }

      if (hasUpdates) {
        await fetchAudioFiles(storyId);
      }
    } catch (error) {
      console.error('❌ [N8nAudio] Erreur vérification fichiers en cours:', error);
    }
  }, [fetchAudioFiles]);

  // Récupérer les fichiers "error" qui ont une URL (fichiers récupérables)
  const recoverErrorFiles = useCallback(async (storyId: string) => {
    try {
      const { data: errorFilesWithUrl, error } = await supabase
        .from('audio_files')
        .select('*')
        .eq('story_id', storyId)
        .eq('status', 'error')
        .not('audio_url', 'is', null);

      if (error) throw error;

      if (errorFilesWithUrl && errorFilesWithUrl.length > 0) {
        console.log(`🔧 [N8nAudio] Récupération de ${errorFilesWithUrl.length} fichiers marqués "error" mais avec URL`);
        
        // Marquer ces fichiers comme "ready"
        for (const file of errorFilesWithUrl) {
          await supabase
            .from('audio_files')
            .update({ 
              status: 'ready',
              updated_at: new Date().toISOString()
            })
            .eq('id', file.id);
        }

        await fetchAudioFiles(storyId);
        
        toast({
          title: "Fichiers récupérés",
          description: `${errorFilesWithUrl.length} fichier(s) audio récupéré(s)`,
        });
      }
    } catch (error) {
      console.error('❌ [N8nAudio] Erreur récupération fichiers:', error);
    }
  }, [fetchAudioFiles, toast]);

  // Générer un audio via n8n avec gestion intelligente du timeout
  const generateAudio = useCallback(async (
    storyId: string, 
    text: string, 
    voiceId: string = '9BWtsMINqrJLrRacOk9x'
  ): Promise<string | null> => {
    if (!text || text.trim().length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun texte à convertir en audio",
        variant: "destructive"
      });
      return null;
    }

    // Nettoyer et récupérer les fichiers d'abord
    await cleanupStuckFiles(storyId);
    await recoverErrorFiles(storyId);

    setIsGenerating(true);
    const requestId = crypto.randomUUID();
    let timeoutId: NodeJS.Timeout;
    let checkInterval: NodeJS.Timeout;

    try {
      console.log('🎙️ [N8nAudio] Génération audio via n8n:', { storyId, textLength: text.length, voiceId, requestId });

      // 1. Créer l'entrée en base
      const { data: audioFile, error: insertError } = await supabase
        .from('audio_files')
        .insert({
          story_id: storyId,
          text_content: text,
          status: 'pending',
          webhook_id: requestId,
          voice_id: voiceId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Vérification périodique du statut (toutes les 3 secondes)
      checkInterval = setInterval(async () => {
        const { data: updatedFile, error: fetchError } = await supabase
          .from('audio_files')
          .select('*')
          .eq('id', audioFile.id)
          .single();

        if (!fetchError && updatedFile) {
          if (updatedFile.status === 'ready' && updatedFile.audio_url) {
            // Succès ! Nettoyer et arrêter
            clearTimeout(timeoutId);
            clearInterval(checkInterval);
            setIsGenerating(false);
            
            toast({
              title: "🎉 Audio généré !",
              description: "Votre audio est prêt à être écouté",
            });
            
            await fetchAudioFiles(storyId);
            return;
          } else if (updatedFile.status === 'error') {
            // Erreur détectée
            clearTimeout(timeoutId);
            clearInterval(checkInterval);
            setIsGenerating(false);
            
            toast({
              title: "Erreur de génération",
              description: "La génération audio a échoué",
              variant: "destructive"
            });
            
            await fetchAudioFiles(storyId);
            return;
          }
        }
      }, 3000);

      // 3. Timeout de sécurité (plus long pour laisser le temps)
      timeoutId = setTimeout(async () => {
        console.log('⏰ [N8nAudio] Timeout atteint');
        clearInterval(checkInterval);
        
        // Vérifier une dernière fois avant de marquer comme erreur
        const { data: finalCheck } = await supabase
          .from('audio_files')
          .select('*')
          .eq('id', audioFile.id)
          .single();

        if (finalCheck?.status === 'ready' && finalCheck.audio_url) {
          // Le fichier est prêt, ne pas marquer comme erreur
          toast({
            title: "🎉 Audio généré !",
            description: "Votre audio est prêt (détecté lors du timeout)",
          });
        } else {
          // Marquer comme erreur seulement si vraiment pas prêt
          await supabase
            .from('audio_files')
            .update({ 
              status: 'error',
              updated_at: new Date().toISOString()
            })
            .eq('id', audioFile.id);

          toast({
            title: "Timeout de génération",
            description: "La génération audio a pris trop de temps",
            variant: "destructive"
          });
        }

        setIsGenerating(false);
        await fetchAudioFiles(storyId);
      }, TIMEOUT_DURATION);

      // 4. Envoyer la requête à n8n
      const payload: N8nWebhookPayload = {
        text: text,
        storyId,
        voiceId,
        requestId
      };

      console.log('📤 [N8nAudio] Envoi vers n8n:', payload);

      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Webhook n8n failed: ${response.status} - ${response.statusText}`);
      }

      // 5. Mettre à jour le statut en "processing"
      await supabase
        .from('audio_files')
        .update({ 
          status: 'processing',
          updated_at: new Date().toISOString()
        })
        .eq('id', audioFile.id);

      toast({
        title: "🎵 Génération audio lancée",
        description: "Votre audio est en cours de génération...",
      });

      // 6. Rafraîchir la liste des fichiers
      await fetchAudioFiles(storyId);

      return audioFile.id;

    } catch (error: any) {
      console.error('💥 [N8nAudio] Erreur génération:', error);
      
      // Nettoyer tous les timers
      if (timeoutId) clearTimeout(timeoutId);
      if (checkInterval) clearInterval(checkInterval);
      
      toast({
        title: "Erreur génération audio",
        description: error?.message || "Impossible de lancer la génération audio",
        variant: "destructive"
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast, fetchAudioFiles, cleanupStuckFiles, recoverErrorFiles]);

  // Mettre à jour un fichier audio (appelé par webhook de retour n8n)
  const updateAudioFile = useCallback(async (
    audioFileId: string,
    updates: Partial<AudioFile>
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('audio_files')
        .update(updates)
        .eq('id', audioFileId);

      if (error) throw error;

      console.log('✅ [N8nAudio] Fichier audio mis à jour:', audioFileId);
      return true;
    } catch (error: any) {
      console.error('❌ [N8nAudio] Erreur mise à jour:', error);
      return false;
    }
  }, []);

  // Supprimer un fichier audio
  const deleteAudioFile = useCallback(async (audioFileId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('audio_files')
        .delete()
        .eq('id', audioFileId);

      if (error) throw error;

      toast({
        title: "Fichier supprimé",
        description: "Le fichier audio a été supprimé",
      });

      return true;
    } catch (error: any) {
      console.error('❌ [N8nAudio] Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le fichier audio",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  return {
    // State
    isGenerating,
    audioFiles,
    
    // Actions
    generateAudio,
    fetchAudioFiles,
    updateAudioFile,
    deleteAudioFile,
    cleanupStuckFiles,
    checkPendingFiles,
    recoverErrorFiles
  };
};
