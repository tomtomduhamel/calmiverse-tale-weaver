import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";

interface TextToSpeechProps {
  text: string;
}

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ text }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { toast } = useToast();

  const handleSpeak = () => {
    // Version simplifiée utilisant l'API Web Speech
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      
      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsPlaying(false);
        toast({
          title: "Erreur",
          description: "Impossible de lire le texte pour le moment.",
          variant: "destructive",
        });
      };

      setIsPlaying(true);
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      toast({
        title: "Erreur",
        description: "Le service de synthèse vocale n'est pas disponible.",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            onClick={isPlaying ? handleStop : handleSpeak}
            className="transition-all hover:scale-105"
          >
            {isPlaying ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isPlaying ? "Arrêter la lecture" : "Lire à voix haute"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};