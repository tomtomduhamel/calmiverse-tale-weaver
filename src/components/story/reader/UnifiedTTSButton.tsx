
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UnifiedTTSButtonProps {
  text: string;
  isDarkMode?: boolean;
}

export const UnifiedTTSButton: React.FC<UnifiedTTSButtonProps> = ({
  text,
  isDarkMode = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioType, setAudioType] = useState<'elevenlabs' | 'system' | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setAudioType(null);
  };

  const playWithElevenLabs = async (): Promise<boolean> => {
    try {
      console.log('🎙️ [UnifiedTTS] Tentative ElevenLabs...');
      
      // Test de connectivité d'abord
      const { data: testData, error: testError } = await supabase.functions.invoke('tts-test', {
        body: { ping: true }
      });

      if (testError) {
        console.error('❌ [UnifiedTTS] Test connectivity failed:', testError);
        return false;
      }

      console.log('✅ [UnifiedTTS] Connectivity test OK:', testData);

      // Tentative de génération audio ElevenLabs
      const { data, error } = await supabase.functions.invoke('tts-elevenlabs', {
        body: {
          text,
          voiceId: '9BWtsMINqrJLrRacOk9x',
          modelId: 'eleven_multilingual_v2'
        }
      });

      if (error) {
        console.error('❌ [UnifiedTTS] ElevenLabs error:', error);
        return false;
      }

      if (!data?.success || !data?.audioContent) {
        console.error('❌ [UnifiedTTS] Invalid ElevenLabs response:', data);
        return false;
      }

      // Créer et jouer l'audio
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onplay = () => {
        setIsPlaying(true);
        setAudioType('elevenlabs');
      };

      audio.onended = () => {
        setIsPlaying(false);
        setAudioType(null);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        console.error('❌ [UnifiedTTS] Audio playback failed');
        URL.revokeObjectURL(audioUrl);
        return false;
      };

      await audio.play();
      console.log('🎉 [UnifiedTTS] ElevenLabs playback started');
      return true;

    } catch (error: any) {
      console.error('💥 [UnifiedTTS] ElevenLabs exception:', error);
      return false;
    }
  };

  const playWithSystemTTS = (): boolean => {
    try {
      console.log('🔊 [UnifiedTTS] Using system TTS fallback...');
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setAudioType('system');
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setAudioType(null);
      };
      
      utterance.onerror = () => {
        console.error('❌ [UnifiedTTS] System TTS failed');
        setIsPlaying(false);
        setAudioType(null);
        return false;
      };

      window.speechSynthesis.speak(utterance);
      console.log('🔊 [UnifiedTTS] System TTS started');
      return true;

    } catch (error: any) {
      console.error('💥 [UnifiedTTS] System TTS exception:', error);
      return false;
    }
  };

  const handlePlayPause = async () => {
    if (isPlaying) {
      stopAudio();
      return;
    }

    if (!text || text.trim().length === 0) {
      toast({
        title: "Erreur",
        description: "Aucun texte à lire",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Essayer ElevenLabs d'abord
      const elevenLabsSuccess = await playWithElevenLabs();
      
      if (elevenLabsSuccess) {
        toast({
          title: "Audio Premium",
          description: "Lecture avec ElevenLabs démarrée",
        });
      } else {
        // Fallback automatique vers le TTS système
        console.log('🔄 [UnifiedTTS] Fallback to system TTS...');
        const systemSuccess = playWithSystemTTS();
        
        if (systemSuccess) {
          toast({
            title: "Audio Standard",
            description: "Lecture avec TTS système (ElevenLabs indisponible)",
            variant: "default"
          });
        } else {
          throw new Error('Both TTS methods failed');
        }
      }

    } catch (error: any) {
      console.error('💥 [UnifiedTTS] All TTS methods failed:', error);
      toast({
        title: "Erreur audio",
        description: "Impossible de lire le texte avec aucune méthode disponible",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Chargement...';
    if (isPlaying) {
      return audioType === 'elevenlabs' ? 'Premium (Pause)' : 'Standard (Pause)';
    }
    return 'Lire l\'histoire';
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    if (isPlaying) {
      return audioType === 'elevenlabs' ? 
        <Pause className="h-4 w-4 mr-2" /> : 
        <VolumeX className="h-4 w-4 mr-2" />;
    }
    return <Play className="h-4 w-4 mr-2" />;
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePlayPause}
        disabled={isLoading}
        className={`w-full ${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
        variant={isPlaying && audioType === 'elevenlabs' ? 'default' : 'outline'}
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
      
      {audioType && (
        <div className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {audioType === 'elevenlabs' ? '🎙️ Audio Premium (ElevenLabs)' : '🔊 Audio Standard (Système)'}
        </div>
      )}
    </div>
  );
};
