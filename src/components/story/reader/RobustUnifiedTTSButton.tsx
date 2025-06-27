
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RobustUnifiedTTSButtonProps {
  text: string;
  isDarkMode?: boolean;
}

export const RobustUnifiedTTSButton: React.FC<RobustUnifiedTTSButtonProps> = ({
  text,
  isDarkMode = false
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioType, setAudioType] = useState<'elevenlabs' | 'system' | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const stopAudio = () => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current.currentTime = 0;
      currentAudioRef.current = null;
    }
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setAudioType(null);
  };

  const playWithSystemTTS = (): boolean => {
    try {
      console.log('🔊 [RobustTTS] Utilisation du TTS système...');
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      
      utterance.onstart = () => {
        setIsPlaying(true);
        setAudioType('system');
        setErrorMessage(null);
      };
      
      utterance.onend = () => {
        setIsPlaying(false);
        setAudioType(null);
      };
      
      utterance.onerror = () => {
        console.error('❌ [RobustTTS] Échec du TTS système');
        setIsPlaying(false);
        setAudioType(null);
        return false;
      };

      window.speechSynthesis.speak(utterance);
      console.log('✅ [RobustTTS] TTS système démarré');
      return true;

    } catch (error: any) {
      console.error('💥 [RobustTTS] Exception TTS système:', error);
      return false;
    }
  };

  const attemptElevenLabsTTS = async (attempt: number = 1): Promise<boolean> => {
    try {
      console.log(`🎙️ [RobustTTS] Tentative ElevenLabs ${attempt}/3...`);
      
      // Test de connectivité de base d'abord
      const { data: pingData, error: pingError } = await supabase.functions.invoke('tts-elevenlabs', {
        body: { ping: true }
      });

      if (pingError) {
        console.error(`❌ [RobustTTS] Ping ElevenLabs échoué (tentative ${attempt}):`, pingError);
        throw new Error(`Connectivité ElevenLabs échouée: ${pingError.message}`);
      }

      console.log(`✅ [RobustTTS] Ping ElevenLabs réussi (tentative ${attempt})`);

      // Génération audio
      const { data, error } = await supabase.functions.invoke('tts-elevenlabs', {
        body: {
          text: text.substring(0, 1000), // Limiter pour éviter les timeouts
          voiceId: '9BWtsMINqrJLrRacOk9x',
          modelId: 'eleven_multilingual_v2'
        }
      });

      if (error) {
        console.error(`❌ [RobustTTS] Erreur ElevenLabs (tentative ${attempt}):`, error);
        throw new Error(error.message || 'Erreur ElevenLabs inconnue');
      }

      if (!data?.success || !data?.audioContent) {
        console.error(`❌ [RobustTTS] Données invalides (tentative ${attempt}):`, data);
        throw new Error('Réponse ElevenLabs invalide');
      }

      // Créer et jouer l'audio
      const audioBlob = new Blob(
        [Uint8Array.from(atob(data.audioContent), c => c.charCodeAt(0))],
        { type: 'audio/mpeg' }
      );
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      return new Promise((resolve) => {
        audio.addEventListener('canplay', () => {
          currentAudioRef.current = audio;
          setIsPlaying(true);
          setAudioType('elevenlabs');
          setErrorMessage(null);
          audio.play().then(() => {
            console.log(`🎉 [RobustTTS] Audio ElevenLabs démarré (tentative ${attempt})`);
            resolve(true);
          }).catch((playError) => {
            console.error(`❌ [RobustTTS] Erreur lecture audio (tentative ${attempt}):`, playError);
            URL.revokeObjectURL(audioUrl);
            resolve(false);
          });
        });

        audio.addEventListener('ended', () => {
          setIsPlaying(false);
          setAudioType(null);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
        });

        audio.addEventListener('error', () => {
          console.error(`❌ [RobustTTS] Erreur audio (tentative ${attempt})`);
          URL.revokeObjectURL(audioUrl);
          resolve(false);
        });

        audio.load();
      });

    } catch (error: any) {
      console.error(`💥 [RobustTTS] Exception ElevenLabs (tentative ${attempt}):`, error);
      
      // Identifier si c'est une erreur temporaire ou permanente
      const isTemporaryError = error.message?.includes('FunctionsFetchError') || 
                               error.message?.includes('timeout') ||
                               error.message?.includes('network') ||
                               error.message?.includes('503') ||
                               error.message?.includes('502');
      
      if (isTemporaryError && attempt < 3) {
        console.log(`🔄 [RobustTTS] Retry dans 2s (tentative ${attempt + 1})`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return await attemptElevenLabsTTS(attempt + 1);
      }
      
      throw error;
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
    setRetryCount(0);
    setErrorMessage(null);

    try {
      // Tentative ElevenLabs d'abord
      console.log('🚀 [RobustTTS] Démarrage séquence TTS...');
      const elevenLabsSuccess = await attemptElevenLabsTTS(1);
      
      if (elevenLabsSuccess) {
        toast({
          title: "🎙️ Audio Premium",
          description: "Lecture ElevenLabs démarrée",
        });
        setRetryCount(retryCount + 1);
        return;
      }

      // Fallback vers TTS système
      console.log('🔄 [RobustTTS] Fallback vers TTS système...');
      const systemSuccess = playWithSystemTTS();
      
      if (systemSuccess) {
        toast({
          title: "🔊 Audio Standard",
          description: "Lecture système démarrée (ElevenLabs temporairement indisponible)",
        });
      } else {
        throw new Error('Échec complet TTS');
      }

    } catch (error: any) {
      console.error('💥 [RobustTTS] Échec total:', error);
      setErrorMessage(error.message);
      
      toast({
        title: "Erreur Audio",
        description: "Impossible de lire le texte pour le moment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Connexion...';
    if (isPlaying) return 'Pause';
    return 'Lire l\'histoire';
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    if (isPlaying) return <Pause className="h-4 w-4 mr-2" />;
    return <Play className="h-4 w-4 mr-2" />;
  };

  const getStatusMessage = () => {
    if (errorMessage) {
      return (
        <div className={`text-xs text-center flex items-center justify-center gap-1 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
          <AlertCircle className="h-3 w-3" />
          Erreur temporaire détectée
        </div>
      );
    }
    
    if (audioType === 'elevenlabs') {
      return (
        <div className={`text-xs text-center ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
          🎙️ Audio Premium (ElevenLabs)
        </div>
      );
    }
    
    if (audioType === 'system') {
      return (
        <div className={`text-xs text-center ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
          🔊 Audio Standard (Système)
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePlayPause}
        disabled={isLoading}
        className={`w-full ${isDarkMode ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
        variant="outline"
      >
        {getButtonIcon()}
        {getButtonText()}
      </Button>
      
      {getStatusMessage()}
      
      {retryCount > 0 && (
        <div className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Tentatives: {retryCount}
        </div>
      )}
    </div>
  );
};
