import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Disc, AlertCircle, RefreshCw, Bug, Play, Pause } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AudioDiagnosticPanel } from './AudioDiagnosticPanel';
import { audioService } from '@/services/audioService';

interface SoundButtonStatesProps {
  isDarkMode: boolean;
  isLoading: boolean;
  error: string | null;
  soundDetails: any;
  storyObjective?: string | null;
  volume: number;
  isPlaying: boolean;
  diagnosticInfo?: any;
  onVolumeToggle: () => void;
  onPlayToggle: () => void;
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
  diagnosticInfo,
  onVolumeToggle,
  onPlayToggle,
  onReinitialize
}) => {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const baseButtonClass = `rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""}`;

  const handleRunDiagnostic = async () => {
    if (soundDetails?.file_path) {
      await audioService.runDiagnostic(soundDetails.file_path);
      onReinitialize(); // Forcer la mise à jour
    }
  };

  const handleClearCache = () => {
    audioService.clearCache();
    onReinitialize();
  };

  // État d'erreur avec diagnostic avancé
  if (error) {
    return (
      <div className="space-y-2">
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
              <div className="text-xs text-blue-500 mt-1">↻ Réessayer</div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
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

  // Contrôles Audio (Volume et Play/Pause)
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {/* Bouton Play/Pause */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                onClick={onPlayToggle}
                className={`${baseButtonClass} ${isPlaying ? 'bg-green-100 dark:bg-green-900/50 ring-1 ring-green-400' : ''}`}
                aria-label={isPlaying ? "Mettre en pause" : "Lancer la lecture"}
              >
                {isPlaying ? <Pause className="h-4 w-4 text-green-600" /> : <Play className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="z-[100]">
              <p>{isPlaying ? "Mettre en pause" : "Lancer la lecture"}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Bouton Volume/Mute */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                onClick={onVolumeToggle}
                className={`${baseButtonClass}`}
                aria-label={volume > 0 ? "Couper le volume" : "Activer le volume"}
              >
                {volume > 0 ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="z-[100]">
              <p>{volume > 0 ? "Couper le son" : "Activer le son"}</p>
              <p className="text-xs opacity-70 mt-1">{soundDetails.title}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};
