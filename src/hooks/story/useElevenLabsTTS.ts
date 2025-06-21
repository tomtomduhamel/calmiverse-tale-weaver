
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseElevenLabsTTSOptions {
  voiceId?: string;
  modelId?: string;
}

export const useElevenLabsTTS = (options: UseElevenLabsTTSOptions = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const {
    voiceId = '9BWtsMINqrJLrRacOk9x', // Aria par défaut
    modelId = 'eleven_multilingual_v2'
  } = options;

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  }, []);

  const generateAndPlaySpeech = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast({
        title: "Erreur",
        description: "Le texte ne peut pas être vide",
        variant: "destructive",
      });
      return;
    }

    // Si déjà en train de jouer, arrêter
    if (isPlaying) {
      stopAudio();
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('🎙️ Début génération ElevenLabs...', { 
        textLength: text.length, 
        voiceId, 
        modelId 
      });

      // Limiter le texte pour éviter les timeouts
      const limitedText = text.slice(0, 1000);
      if (text.length > 1000) {
        toast({
          title: "Texte tronqué",
          description: `Le texte a été limité à 1000 caractères (était ${text.length})`,
        });
      }
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { 
          text: limitedText,
          voiceId,
          modelId 
        }
      });

      console.log('📡 Réponse reçue:', { data, error });

      if (error) {
        console.error('❌ Erreur Supabase fonction:', error);
        throw new Error(`Erreur de connexion: ${error.message}`);
      }

      if (!data?.success || !data?.audioContent) {
        console.error('❌ Réponse invalide:', data);
        throw new Error(data?.error || 'Réponse invalide du service de synthèse vocale');
      }

      // Créer l'URL audio à partir du base64
      console.log('🎵 Création de l\'audio blob...');
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      // Créer et configurer l'élément audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      // Gestionnaires d'événements audio
      audio.onloadstart = () => {
        console.log('🔄 Chargement audio démarré');
        setIsLoading(true);
      };
      
      audio.oncanplay = () => {
        console.log('✅ Audio prêt à jouer');
        setIsLoading(false);
      };
      
      audio.onplay = () => {
        console.log('▶️ Lecture audio démarrée');
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        console.log('⏹️ Lecture audio terminée');
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = (e) => {
        console.error('💥 Erreur lecture audio:', e);
        setIsPlaying(false);
        setError('Erreur lors de la lecture audio');
        URL.revokeObjectURL(audioUrl);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio généré",
          variant: "destructive",
        });
      };

      // Lancer la lecture
      await audio.play();

      toast({
        title: "Lecture démarrée",
        description: `Audio généré avec la voix sélectionnée`,
      });

    } catch (error: any) {
      console.error('💥 Erreur synthèse vocale:', error);
      const errorMessage = error.message || 'Erreur lors de la génération de la voix';
      setError(errorMessage);
      
      // Messages d'erreur spécifiques
      let userMessage = "Impossible de générer l'audio";
      if (errorMessage.includes('Clé API')) {
        userMessage = "Clé API ElevenLabs non configurée ou invalide";
      } else if (errorMessage.includes('quota')) {
        userMessage = "Limite de quota ElevenLabs atteinte";
      } else if (errorMessage.includes('Timeout')) {
        userMessage = "La génération a pris trop de temps, essayez un texte plus court";
      }
      
      toast({
        title: "Erreur de synthèse vocale",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [voiceId, modelId, isPlaying, stopAudio, toast]);

  return {
    generateAndPlaySpeech,
    stopAudio,
    isLoading,
    isPlaying,
    error
  };
};
