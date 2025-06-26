
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TTSHookProps {
  voiceId?: string;
  modelId?: string;
}

interface TTSCache {
  [key: string]: string;
}

export const useElevenLabsTTSNew = ({ voiceId, modelId }: TTSHookProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
  const [audioCache] = useState<TTSCache>({});
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  const { toast } = useToast();

  const generateAndPlaySpeech = useCallback(async (text: string) => {
    if (!text.trim()) {
      toast({
        title: "Erreur",
        description: "Le texte est requis pour la synthèse vocale",
        variant: "destructive"
      });
      return;
    }

    const cacheKey = `${text.substring(0, 100)}-${voiceId}-${modelId}`;
    
    try {
      setIsLoading(true);
      setGenerationProgress("Initialisation de la synthèse vocale...");
      
      let audioContent = audioCache[cacheKey];
      
      if (!audioContent) {
        setGenerationProgress("Génération de l'audio avec ElevenLabs...");
        
        console.log('🎙️ [TTS] Calling tts-elevenlabs function...');
        
        const { data, error } = await supabase.functions.invoke('tts-elevenlabs', {
          body: {
            text,
            voiceId: voiceId || '9BWtsMINqrJLrRacOk9x',
            modelId: modelId || 'eleven_multilingual_v2'
          }
        });

        if (error) {
          console.error('❌ [TTS] Error:', error);
          throw new Error(error.message || 'Erreur lors de la génération audio');
        }

        if (!data?.success) {
          console.error('❌ [TTS] Generation failed:', data);
          throw new Error(data?.error || 'Échec de la génération audio');
        }

        audioContent = data.audioContent;
        audioCache[cacheKey] = audioContent;
        
        console.log('✅ [TTS] Audio generated successfully');
      } else {
        setGenerationProgress("Lecture depuis le cache...");
        console.log('📦 [TTS] Using cached audio');
      }

      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Create new audio element
      const audio = new Audio(`data:audio/mpeg;base64,${audioContent}`);
      setCurrentAudio(audio);

      // Set up audio event listeners
      audio.addEventListener('loadstart', () => {
        setGenerationProgress("Préparation de la lecture...");
      });

      audio.addEventListener('canplay', () => {
        setIsLoading(false);
        setGenerationProgress(null);
        setIsPlaying(true);
        audio.play().catch(e => {
          console.error('❌ [TTS] Play error:', e);
          toast({
            title: "Erreur de lecture",
            description: "Impossible de lire l'audio. Cliquez pour réessayer.",
            variant: "destructive"
          });
        });
      });

      audio.addEventListener('timeupdate', () => {
        if (audio.duration) {
          const progressPercent = (audio.currentTime / audio.duration) * 100;
          setProgress(progressPercent);
        }
      });

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setProgress(0);
        console.log('🏁 [TTS] Audio playback completed');
      });

      audio.addEventListener('error', (e) => {
        console.error('❌ [TTS] Audio playback error:', e);
        setIsLoading(false);
        setIsPlaying(false);
        setGenerationProgress(null);
        toast({
          title: "Erreur de lecture",
          description: "Impossible de lire l'audio généré",
          variant: "destructive"
        });
      });

      audio.load();

    } catch (error: any) {
      console.error('💥 [TTS] Generation error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      setGenerationProgress(null);
      
      let errorMessage = "Une erreur est survenue lors de la génération audio";
      
      if (error.message?.includes('Failed to send')) {
        errorMessage = "Impossible de contacter le service TTS. Vérifiez votre connexion.";
      } else if (error.message?.includes('Invalid authentication')) {
        errorMessage = "Problème d'authentification. Reconnectez-vous.";
      } else if (error.message?.includes('quota')) {
        errorMessage = "Limite ElevenLabs atteinte. Essayez plus tard.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erreur de synthèse vocale",
        description: errorMessage,
        variant: "destructive"
      });
    }
  }, [voiceId, modelId, audioCache, currentAudio, toast]);

  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      console.log('⏹️ [TTS] Audio stopped');
    }
  }, [currentAudio]);

  const clearCache = useCallback(() => {
    Object.keys(audioCache).forEach(key => delete audioCache[key]);
    console.log('🗑️ [TTS] Cache cleared');
    toast({
      title: "Cache vidé",
      description: "Le cache audio a été vidé avec succès"
    });
  }, [audioCache, toast]);

  const testConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setGenerationProgress("Test de connexion ElevenLabs...");
      console.log('🔗 [TTS] Testing connection...');

      const { data, error } = await supabase.functions.invoke('tts-elevenlabs', {
        body: { testConnection: true }
      });

      if (error) {
        console.error('❌ [TTS] Connection test error:', error);
        throw new Error(error.message || 'Erreur de connexion');
      }

      if (data?.success) {
        console.log('✅ [TTS] Connection test successful:', data);
        toast({
          title: "Test réussi",
          description: data.message || "Connexion ElevenLabs fonctionnelle",
        });
      } else {
        console.error('❌ [TTS] Connection test failed:', data);
        throw new Error(data?.message || 'Test de connexion échoué');
      }

      return data;

    } catch (error: any) {
      console.error('💥 [TTS] Connection test failed:', error);
      toast({
        title: "Test échoué",
        description: error.message || "Impossible de tester la connexion",
        variant: "destructive"
      });
      throw error;
    } finally {
      setIsLoading(false);
      setGenerationProgress(null);
    }
  }, [toast]);

  return {
    generateAndPlaySpeech,
    stopAudio,
    clearCache,
    testConnection,
    isLoading,
    isPlaying,
    progress,
    generationProgress,
    cacheSize: Object.keys(audioCache).length
  };
};
