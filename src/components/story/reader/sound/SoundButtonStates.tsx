
import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Disc, AlertCircle, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SoundButtonStatesProps {
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  soundDetails: any;
  storyObjective?: string | null;
  volume: number;
  isPlaying: boolean;
  onVolumeToggle: () => void;
  onReinitialize: () => void;
}

export const SoundButtonStates: React.FC<SoundButtonStatesProps> = ({
  isDarkMode,
  isLoading,
  error,
  soundDetails,
  storyObjective,
  volume,
  isPlaying,
  onVolumeToggle,
  onReinitialize
}) => {
  const baseButtonClass = `rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""}`;

  // État d'erreur
  if (error) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                className={`${baseButtonClass} bg-red-100 dark:bg-red-900/30`}
                aria-label="Erreur de fond sonore"
                disabled
              >
                <AlertCircle className="h-4 w-4 text-red-500" />
              </Button>
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                onClick={onReinitialize}
                className={`${baseButtonClass} hover:bg-blue-100 dark:hover:bg-blue-900/30`}
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

  // État de chargement
  if (isLoading) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDarkMode ? "outline" : "ghost"}
              size="icon"
              className={baseButtonClass}
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

  // Aucun son disponible
  if (!soundDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isDarkMode ? "outline" : "ghost"}
              size="icon"
              className={`${baseButtonClass} opacity-50`}
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

  // Contrôle du volume
  const buttonStateClass = volume > 0 && isPlaying 
    ? "bg-green-100 dark:bg-green-900 ring-2 ring-green-300 dark:ring-green-700" 
    : volume > 0 
    ? "bg-blue-100 dark:bg-blue-900" 
    : "bg-gray-100 dark:bg-gray-800";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDarkMode ? "outline" : "ghost"}
            size="icon"
            onClick={onVolumeToggle}
            className={`${baseButtonClass} ${buttonStateClass} transition-all duration-200`}
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
