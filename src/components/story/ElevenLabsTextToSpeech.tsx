
import React from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import { useElevenLabsTTS } from '@/hooks/story/useElevenLabsTTS';

interface ElevenLabsTextToSpeechProps {
  text: string;
  isDarkMode?: boolean;
  voiceId?: string;
  modelId?: string;
  className?: string;
}

export const ElevenLabsTextToSpeech: React.FC<ElevenLabsTextToSpeechProps> = ({ 
  text, 
  isDarkMode = false,
  voiceId,
  modelId,
  className = ""
}) => {
  const { 
    generateAndPlaySpeech, 
    stopAudio, 
    isLoading, 
    isPlaying 
  } = useElevenLabsTTS({ voiceId, modelId });

  const handleClick = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      generateAndPlaySpeech(text);
    }
  };

  const getButtonIcon = () => {
    if (isLoading) {
      return <Loader2 className="h-4 w-4 animate-spin" />;
    }
    return isPlaying ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />;
  };

  const getButtonTitle = () => {
    if (isLoading) return "Génération de l'audio...";
    return isPlaying ? "Arrêter la lecture" : "Lire avec ElevenLabs";
  };

  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isLoading || !text.trim()}
      className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle} ${className}`}
      title={getButtonTitle()}
    >
      {getButtonIcon()}
    </Button>
  );
};
