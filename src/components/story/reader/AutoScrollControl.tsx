
import React from 'react';
import { Button } from "@/components/ui/button";
import { Pause, ArrowDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AutoScrollControlProps {
  isAutoScrolling: boolean;
  isManuallyPaused: boolean;
  onToggleAutoScroll: () => void;
  isDarkMode: boolean;
}

export const AutoScrollControl: React.FC<AutoScrollControlProps> = ({
  isAutoScrolling,
  isManuallyPaused,
  onToggleAutoScroll,
  isDarkMode
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={onToggleAutoScroll}
            className={`transition-transform hover:scale-105 flex items-center gap-2 ${
              isDarkMode ? "text-white border-gray-600 hover:bg-gray-700" : ""
            } ${isAutoScrolling ? "bg-primary/20 border-primary/50" : ""} ${
              isManuallyPaused ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800" : ""
            }`}
            aria-label={isAutoScrolling ? "Arrêter défilement" : isManuallyPaused ? "Reprendre défilement" : "Défilement automatique"}
          >
            {isAutoScrolling 
              ? <Pause className="h-4 w-4" /> 
              : <ArrowDown className="h-4 w-4" />
            }
            {isAutoScrolling ? "Arrêter" : isManuallyPaused ? "Reprendre" : "Défiler"}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isAutoScrolling ? "Arrêter le défilement automatique" : isManuallyPaused ? "Reprendre le défilement automatique" : "Activer le défilement automatique"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
