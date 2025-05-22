
import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Disc, AlertCircle } from "lucide-react";
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
    musicEnabled,
    error
  } = useBackgroundSound({ 
    soundId, 
    storyObjective,
    autoPlay 
  });

  // Log pour débogage
  console.log("🎵 BackgroundSoundButton rendu avec:", {
    soundId,
    storyObjective,
    isDarkMode,
    autoPlay,
    isPlaying,
    isLoading,
    soundDetails: soundDetails ? { id: soundDetails.id, title: soundDetails.title, objective: soundDetails.objective } : null,
    musicEnabled,
    error
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

  // En cas d'erreur, afficher un bouton d'alerte
  if (error) {
    console.error("❌ Erreur de fond sonore:", error);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDarkMode ? "outline" : "ghost"}
              size="icon"
              className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} bg-red-100 dark:bg-red-900/30`}
              aria-label="Erreur de fond sonore"
              disabled
            >
              <AlertCircle className="h-4 w-4 text-red-500" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs text-red-500">Erreur de fond sonore</div>
            <div className="text-xs opacity-70">{error}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Si en cours de chargement sans erreur, afficher l'indicateur
  if (isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDarkMode ? "outline" : "ghost"}
              size="icon"
              className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""}`}
              disabled
            >
              <Disc className="h-4 w-4 animate-spin" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="text-xs">Chargement du fond sonore...</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Si aucun son n'a été trouvé, ne pas afficher le bouton
  if (!soundDetails) {
    return null;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDarkMode ? "outline" : "ghost"}
            size="icon"
            onClick={togglePlay}
            className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} ${isPlaying ? "bg-green-100 dark:bg-green-900" : ""} transition-all`}
            aria-label={isPlaying ? "Mettre en pause le fond sonore" : "Jouer le fond sonore"}
          >
            {isPlaying ? (
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
