
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';

interface TextToSpeechProps {
  text: string;
  isDarkMode?: boolean;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ text, isDarkMode = false }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const handleTextToSpeech = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };
  
  // Style amélioré pour le bouton en fonction du mode sombre
  const buttonStyle = isDarkMode 
    ? "border-gray-600 text-white hover:bg-gray-700" 
    : "";
  
  return (
    <Button
      variant="outline"
      onClick={handleTextToSpeech}
      className={`w-10 h-10 transition-transform hover:scale-105 ${buttonStyle}`}
      title={isSpeaking ? "Arrêter la lecture" : "Lire à haute voix"}
    >
      {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </Button>
  );
};
