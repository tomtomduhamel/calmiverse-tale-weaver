
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
    soundDetails,
    musicEnabled,
    error,
    volume,
    setVolume
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
    error,
    volume
  });

  // Si la musique est désactivée, ne rien afficher
  if (!musicEnabled) {
    console.log("🎵 Musique désactivée dans les préférences");
    return null;
  }

  // Fonction pour basculer entre muet et volume normal
  const toggleVolume = () => {
    if (volume > 0) {
      setVolume(0); // Couper le son
    } else {
      setVolume(0.5); // Remettre un volume normal
    }
  };

  // Adapter le texte du tooltip en fonction de l'objectif
  let tooltipText = 'Volume du fond sonore';
  if (soundDetails?.objective) {
    switch (soundDetails.objective) {
      case 'sleep':
        tooltipText = 'Volume du fond sonore pour s\'endormir';
        break;
      case 'focus':
        tooltipText = 'Volume du fond sonore pour la concentration';
        break;
      case 'relax':
        tooltipText = 'Volume du fond sonore pour la relaxation';
        break;
      case 'fun':
        tooltipText = 'Volume du fond sonore pour s\'amuser';
        break;
      default:
        tooltipText = 'Volume du fond sonore';
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
          <TooltipContent side="bottom" className="z-[100]">
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
          <TooltipContent side="bottom" className="z-[100]">
            <div className="text-xs">Chargement du fond sonore...</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Si aucun son n'a été trouvé, ne pas afficher le bouton
  if (!soundDetails) {
    console.log("🎵 Aucun fond sonore disponible");
    return null;
  }

  // Bouton de contrôle du volume avec tooltip
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDarkMode ? "outline" : "ghost"}
            size="icon"
            onClick={toggleVolume}
            className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} ${volume > 0 ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800"} transition-all`}
            aria-label={volume > 0 ? "Couper le volume du fond sonore" : "Activer le volume du fond sonore"}
          >
            {volume > 0 ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="z-[100]">
          <div className="text-xs">
            {volume > 0 ? "Couper le volume" : "Activer le volume"}
          </div>
          {soundDetails && (
            <div className="text-xs opacity-70 mt-1">{soundDetails.title}</div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BackgroundSoundButton;
