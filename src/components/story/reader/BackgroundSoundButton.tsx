
import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Disc } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useBackgroundSound } from '@/hooks/story/useBackgroundSound';

interface BackgroundSoundButtonProps {
  soundId?: string | null;
  storyObjective?: string | null;
  isDarkMode?: boolean;
  autoPlay?: boolean;
}

export const BackgroundSoundButton: React.FC<BackgroundSoundButtonProps> = ({
  soundId,
  storyObjective,
  isDarkMode = false,
  autoPlay = false
}) => {
  const {
    isPlaying,
    isLoading,
    togglePlay,
    soundDetails,
    musicEnabled
  } = useBackgroundSound({ 
    soundId, 
    storyObjective,
    autoPlay 
  });

  // Si la musique est désactivée, ne rien afficher
  if (!musicEnabled) {
    return null;
  }

  // Adapter le texte du tooltip en fonction de l'objectif
  let objectiveText = '';
  if (soundDetails?.objective) {
    switch (soundDetails.objective) {
      case 'sleep':
        objectiveText = 'Fond sonore pour s\'endormir';
        break;
      case 'focus':
        objectiveText = 'Fond sonore pour la concentration';
        break;
      case 'relax':
        objectiveText = 'Fond sonore pour la relaxation';
        break;
      case 'fun':
        objectiveText = 'Fond sonore pour s\'amuser';
        break;
      default:
        objectiveText = '';
    }
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDarkMode ? "outline" : "ghost"}
            size="icon"
            onClick={togglePlay}
            disabled={isLoading}
            className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} ${isPlaying ? "bg-green-100 dark:bg-green-900" : ""} transition-all`}
            aria-label={isPlaying ? "Mettre en pause le fond sonore" : "Jouer le fond sonore"}
          >
            {isLoading ? (
              <Disc className="h-4 w-4 animate-spin" />
            ) : isPlaying ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isPlaying ? "Mettre en pause le fond sonore" : "Jouer le fond sonore"}
          {soundDetails && (
            <>
              <div className="text-xs opacity-70">{soundDetails.title}</div>
              {objectiveText && <div className="text-xs opacity-70 italic">{objectiveText}</div>}
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
