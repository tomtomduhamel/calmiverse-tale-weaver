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
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    if (!process.env.ELEVEN_LABS_API_KEY) {
      toast({
        title: "Configuration manquante",
        description: "La clé API ElevenLabs n'est pas configurée.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Stop any currently playing audio
      if (audio) {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      }

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': process.env.ELEVEN_LABS_API_KEY
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération audio');
      }

      // Create a copy of the response to avoid locking issues
      const responseClone = response.clone();
      
      // Convert the response to blob
      const audioBlob = await responseClone.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const newAudio = new Audio(audioUrl);
      setAudio(newAudio);
      
      // Play the audio
      await newAudio.play();
      setIsPlaying(true);
      
      newAudio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

    } catch (error) {
      console.error('Error in text-to-speech:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer l'audio pour le moment.",
        variant: "destructive",
      });
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    if (audio) {
      audio.pause();
      if (audio.src) {
        URL.revokeObjectURL(audio.src);
      }
      setIsPlaying(false);
    }
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