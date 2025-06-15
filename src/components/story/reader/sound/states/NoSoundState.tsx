
import React from 'react';
import { Button } from "@/components/ui/button";
import { VolumeX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NoSoundStateProps {
  isDarkMode: boolean;
  storyObjective?: string | null;
}

export const NoSoundState: React.FC<NoSoundStateProps> = ({ isDarkMode, storyObjective }) => {
  const baseButtonClass = `rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""}`;

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
};
