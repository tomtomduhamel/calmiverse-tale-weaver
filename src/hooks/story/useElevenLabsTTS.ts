
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
      console.log('Génération de la synthèse vocale avec ElevenLabs...');
      
      const { data, error } = await supabase.functions.invoke('elevenlabs-tts', {
        body: { 
          text: text.slice(0, 2500), // Limiter à 2500 caractères pour éviter les timeouts
          voiceId,
          modelId 
        }
      });

      if (error) {
        console.error('Erreur lors de l\'appel à elevenlabs-tts:', error);
        throw new Error(error.message || 'Erreur lors de la génération audio');
      }

      if (!data?.success || !data?.audioContent) {
        throw new Error('Réponse invalide du service de synthèse vocale');
      }

      // Créer l'URL audio à partir du base64
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);

      // Créer et configurer l'élément audio
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onloadstart = () => setIsLoading(true);
      audio.oncanplay = () => setIsLoading(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = () => {
        setIsPlaying(false);
        setError('Erreur lors de la lecture audio');
        URL.revokeObjectURL(audioUrl);
      };

      // Lancer la lecture
      await audio.play();

    } catch (error: any) {
      console.error('Erreur lors de la synthèse vocale:', error);
      setError(error.message || 'Erreur lors de la génération de la voix');
      
      toast({
        title: "Erreur de synthèse vocale",
        description: error.message || "Impossible de générer l'audio",
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
