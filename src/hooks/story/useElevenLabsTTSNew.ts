
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TTSHookProps {
  voiceId?: string;
  modelId?: string;
}

export const useElevenLabsTTSNew = ({ voiceId, modelId }: TTSHookProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationProgress, setGenerationProgress] = useState<string | null>(null);
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

    try {
      setIsLoading(true);
      setGenerationProgress("Test de connectivité...");
      
      console.log('🎙️ [TTS] Testing connectivity...');
      
      // Test de base d'abord
      const { data: connectTest, error: connectError } = await supabase.functions.invoke('tts-test', {
        body: { ping: true }
      });

      if (connectError) {
        console.error('❌ [TTS] Connectivity test failed:', connectError);
        throw new Error('Problème de connectivité avec Supabase Functions');
      }

      console.log('✅ [TTS] Connectivity OK:', connectTest);
      setGenerationProgress("Génération audio ElevenLabs...");

      const { data, error } = await supabase.functions.invoke('tts-elevenlabs', {
        body: {
          text,
          voiceId: voiceId || '9BWtsMINqrJLrRacOk9x',
          modelId: modelId || 'eleven_multilingual_v2'
        }
      });

      if (error) {
        console.error('❌ [TTS] ElevenLabs error:', error);
        throw new Error(error.message || 'Erreur ElevenLabs');
      }

      if (!data?.success) {
        console.error('❌ [TTS] Generation failed:', data);
        throw new Error(data?.error || 'Échec de la génération audio');
      }

      setGenerationProgress("Préparation de la lecture...");

      // Stop current audio if playing
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }

      // Create new audio element
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);

      // Set up audio event listeners
      audio.addEventListener('canplay', () => {
        setIsLoading(false);
        setGenerationProgress(null);
        setIsPlaying(true);
        audio.play().catch(e => {
          console.error('❌ [TTS] Play error:', e);
          throw new Error('Erreur de lecture audio');
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
        URL.revokeObjectURL(audioUrl);
        console.log('🏁 [TTS] Audio playback completed');
      });

      audio.addEventListener('error', (e) => {
        console.error('❌ [TTS] Audio playback error:', e);
        setIsLoading(false);
        setIsPlaying(false);
        setGenerationProgress(null);
        URL.revokeObjectURL(audioUrl);
        throw new Error('Erreur de lecture audio');
      });

      audio.load();

    } catch (error: any) {
      console.error('💥 [TTS] Generation error:', error);
      setIsLoading(false);
      setIsPlaying(false);
      setGenerationProgress(null);
      throw error; // Re-throw for caller handling
    }
  }, [voiceId, modelId, currentAudio]);

  const stopAudio = useCallback(() => {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      setIsPlaying(false);
      setProgress(0);
      console.log('⏹️ [TTS] Audio stopped');
    }
  }, [currentAudio]);

  const testConnection = useCallback(async () => {
    try {
      setIsLoading(true);
      setGenerationProgress("Test de connexion...");
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
        return data;
      } else {
        console.error('❌ [TTS] Connection test failed:', data);
        throw new Error(data?.message || 'Test de connexion échoué');
      }

    } finally {
      setIsLoading(false);
      setGenerationProgress(null);
    }
  }, []);

  return {
    generateAndPlaySpeech,
    stopAudio,
    testConnection,
    isLoading,
    isPlaying,
    progress,
    generationProgress,
    cacheSize: 0 // Simplified, no cache for now
  };
};
