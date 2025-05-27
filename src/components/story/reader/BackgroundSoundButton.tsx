
import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Disc, AlertCircle, RefreshCw } from "lucide-react";
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
    setVolume,
    reinitialize
  } = useBackgroundSound({ 
    soundId, 
    storyObjective,
    autoPlay 
  });

  // Log pour débogage
  console.log("🎵 BackgroundSoundButton rendu:", {
    soundId,
    storyObjective,
    isPlaying,
    isLoading,
    soundDetails: soundDetails ? { id: soundDetails.id, title: soundDetails.title } : null,
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
  const getTooltipText = () => {
    const baseText = 'Volume du fond sonore';
    if (!soundDetails?.objective) return baseText;
    
    const objectiveTexts = {
      sleep: 'pour s\'endormir',
      focus: 'pour la concentration', 
      relax: 'pour la relaxation',
      fun: 'pour s\'amuser'
    };
    
    return `${baseText} ${objectiveTexts[soundDetails.objective as keyof typeof objectiveTexts] || ''}`;
  };

  // En cas d'erreur, afficher un bouton d'erreur avec option de retry
  if (error) {
    console.error("❌ Erreur de fond sonore:", error);
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} bg-red-100 dark:bg-red-900/30`}
                aria-label="Erreur de fond sonore"
                disabled
              >
                <AlertCircle className="h-4 w-4 text-red-500" />
              </Button>
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                onClick={reinitialize}
                className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                aria-label="Réessayer le chargement"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="z-[100]">
            <div className="text-xs text-red-500">Erreur de fond sonore</div>
            <div className="text-xs opacity-70">{error}</div>
            <div className="text-xs text-blue-500 mt-1">Cliquez sur ↻ pour réessayer</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Si en cours de chargement, afficher l'indicateur
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

  // Si aucun son n'a été trouvé, afficher un indicateur d'absence
  if (!soundDetails) {
    console.log("🎵 Aucun fond sonore disponible");
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDarkMode ? "outline" : "ghost"}
              size="icon"
              className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} opacity-50`}
              disabled
            >
              <VolumeX className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="z-[100]">
            <div className="text-xs">Aucun fond sonore disponible</div>
            <div className="text-xs opacity-70">
              {storyObjective ? `pour l'objectif: ${storyObjective}` : ''}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Bouton de contrôle du volume avec retour visuel amélioré
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDarkMode ? "outline" : "ghost"}
            size="icon"
            onClick={toggleVolume}
            className={`rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""} ${
              volume > 0 && isPlaying 
                ? "bg-green-100 dark:bg-green-900 ring-2 ring-green-300 dark:ring-green-700" 
                : volume > 0 
                ? "bg-blue-100 dark:bg-blue-900" 
                : "bg-gray-100 dark:bg-gray-800"
            } transition-all duration-200`}
            aria-label={volume > 0 ? "Couper le volume du fond sonore" : "Activer le volume du fond sonore"}
          >
            {volume > 0 ? (
              <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-green-600 dark:text-green-400' : ''}`} />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="z-[100]">
          <div className="text-xs font-medium">
            {volume > 0 ? "Couper le volume" : "Activer le volume"}
          </div>
          {soundDetails && (
            <>
              <div className="text-xs opacity-70 mt-1">{soundDetails.title}</div>
              <div className="text-xs opacity-60">
                État: {isPlaying ? "🎵 En lecture" : "⏸️ En pause"}
              </div>
            </>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default BackgroundSoundButton;
