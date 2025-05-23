
import React from 'react';
import { Button } from "@/components/ui/button";
import { Pause, ArrowDown, Play } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AutoScrollControlProps {
  isAutoScrolling: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
  onToggleAutoScroll: () => void;
  isDarkMode: boolean;
}

export const AutoScrollControl: React.FC<AutoScrollControlProps> = ({
  isAutoScrolling,
  isPaused,
  isManuallyPaused,
  onToggleAutoScroll,
  isDarkMode
}) => {
  // Déterminer l'icône et le texte en fonction de l'état
  const getButtonContent = () => {
    if (isAutoScrolling) {
      return {
        icon: <Pause className="h-4 w-4" />,
        text: "Arrêter"
      };
    } else if (isPaused) {
      return {
        icon: <Play className="h-4 w-4" />,
        text: "Reprendre"
      };
    } else {
      return {
        icon: <ArrowDown className="h-4 w-4" />,
        text: "Défiler"
      };
    }
  };

  const { icon, text } = getButtonContent();
  
  // Déterminer les classes de style en fonction de l'état
  const getButtonClasses = () => {
    if (isAutoScrolling) {
      return "bg-primary/20 border-primary/50";
    } else if (isPaused) {
      return "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800";
    } else if (isManuallyPaused) {
      return "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800";
    } else {
      return "";
    }
  };

  // Déterminer le texte du tooltip en fonction de l'état
  const getTooltipText = () => {
    if (isAutoScrolling) {
      return "Arrêter le défilement automatique";
    } else if (isPaused) {
      return "Reprendre le défilement automatique";
    } else if (isManuallyPaused) {
      return "Redémarrer le défilement automatique";
    } else {
      return "Activer le défilement automatique";
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            onClick={onToggleAutoScroll}
            className={`transition-transform hover:scale-105 flex items-center gap-2 ${
              isDarkMode ? "text-white border-gray-600 hover:bg-gray-700" : ""
            } ${getButtonClasses()}`}
            aria-label={getTooltipText()}
          >
            {icon}
            {text}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getTooltipText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
