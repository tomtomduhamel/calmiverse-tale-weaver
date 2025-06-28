
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

const N8N_WEBHOOK_URL = 'https://n8n.srv856374.hstgr.cloud/webhook-test/d2d88f5d-78c0-49c1-83b8-096d4b21190c';

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

  // Générer un audio via n8n
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

    setIsGenerating(true);
    const requestId = crypto.randomUUID();

    try {
      console.log('🎙️ [N8nAudio] Génération audio via n8n:', { storyId, textLength: text.length, voiceId });

      // 1. Créer l'entrée en base
      const { data: audioFile, error: insertError } = await supabase
        .from('audio_files')
        .insert({
          story_id: storyId,
          text_content: text.substring(0, 1000), // Limiter pour éviter les textes trop longs
          status: 'pending',
          webhook_id: requestId,
          voice_id: voiceId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 2. Envoyer la requête à n8n
      const payload: N8nWebhookPayload = {
        text: text.substring(0, 1000),
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
        throw new Error(`Webhook n8n failed: ${response.status}`);
      }

      // 3. Mettre à jour le statut en "processing"
      await supabase
        .from('audio_files')
        .update({ status: 'processing' })
        .eq('id', audioFile.id);

      toast({
        title: "🎵 Génération audio lancée",
        description: "Votre audio est en cours de génération via n8n",
      });

      // 4. Rafraîchir la liste des fichiers
      await fetchAudioFiles(storyId);

      return audioFile.id;

    } catch (error: any) {
      console.error('💥 [N8nAudio] Erreur génération:', error);
      
      toast({
        title: "Erreur génération audio",
        description: error?.message || "Impossible de lancer la génération audio",
        variant: "destructive"
      });

      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [toast, fetchAudioFiles]);

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
    deleteAudioFile
  };
};
