
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
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
  const [audioType, setAudioType] = useState<'system' | null>(null);
  const { toast } = useToast();

  const stopAudio = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setAudioType(null);
  };

  const playWithSystemTTS = (): boolean => {
    try {
      console.log('🔊 [UnifiedTTS] Using system TTS...');
      
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
      // Utiliser directement le TTS système pour éviter les problèmes de connectivité
      const systemSuccess = playWithSystemTTS();
      
      if (systemSuccess) {
        toast({
          title: "Audio Standard",
          description: "Lecture avec TTS système démarrée",
        });
      } else {
        throw new Error('TTS system failed');
      }

    } catch (error: any) {
      console.error('💥 [UnifiedTTS] TTS failed:', error);
      toast({
        title: "Erreur audio",
        description: "Impossible de lire le texte",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonText = () => {
    if (isLoading) return 'Chargement...';
    if (isPlaying) return 'Pause';
    return 'Lire l\'histoire';
  };

  const getButtonIcon = () => {
    if (isLoading) return <Loader2 className="h-4 w-4 mr-2 animate-spin" />;
    if (isPlaying) return <Pause className="h-4 w-4 mr-2" />;
    return <Play className="h-4 w-4 mr-2" />;
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
      
      {audioType && (
        <div className={`text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          🔊 Audio Standard (Système)
        </div>
      )}
    </div>
  );
};
