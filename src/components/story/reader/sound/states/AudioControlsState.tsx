
import React from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AudioControlsStateProps {
  isDarkMode: boolean;
  isPlaying: boolean;
  volume: number;
  soundDetails: any;
  onPlayToggle: () => void;
  onVolumeToggle: () => void;
}

export const AudioControlsState: React.FC<AudioControlsStateProps> = ({
  isDarkMode,
  isPlaying,
  volume,
  soundDetails,
  onPlayToggle,
  onVolumeToggle,
}) => {
  const baseButtonClass = `rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""}`;

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
