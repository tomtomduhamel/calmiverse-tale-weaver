import React from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause, ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FloatingAutoScrollButtonProps {
  isAutoScrolling: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
  onToggleAutoScroll: () => void;
  isDarkMode: boolean;
}

export const FloatingAutoScrollButton: React.FC<FloatingAutoScrollButtonProps> = ({
  isAutoScrolling,
  isPaused,
  isManuallyPaused,
  onToggleAutoScroll,
  isDarkMode
}) => {
  const isMobile = useIsMobile();

  // Déterminer l'icône et l'état visuel
  const getButtonState = () => {
    if (isAutoScrolling) {
      return {
        icon: <Pause className="h-5 w-5" />,
        tooltip: "Arrêter le défilement",
        bgClass: "bg-primary/20 border-primary/50 text-primary",
        hoverClass: "hover:bg-primary/30"
      };
    } else if (isPaused || isManuallyPaused) {
      return {
        icon: <Play className="h-5 w-5" />,
        tooltip: "Reprendre le défilement",
        bgClass: "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300",
        hoverClass: "hover:bg-amber-200 dark:hover:bg-amber-900/50"
      };
    } else {
      return {
        icon: <ArrowDown className="h-5 w-5" />,
        tooltip: "Démarrer le défilement",
        bgClass: isDarkMode ? "bg-gray-800 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-700",
        hoverClass: isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"
      };
    }
  };

  const { icon, tooltip, bgClass, hoverClass } = getButtonState();

  // Position adaptée selon l'appareil pour éviter la superposition
  const getPositionStyles = () => {
    if (isMobile) {
      return {
        bottom: '2rem',
        left: '1rem',     // Côté gauche sur mobile
      };
    }
    return {
      bottom: '2rem',     // Même niveau que le toggle button
      left: '2rem',       // Côté gauche sur desktop pour éviter la superposition
    };
  };

  const positionStyles = getPositionStyles();

  return (
    <div 
      className="fixed z-50 transition-all duration-300"
      style={positionStyles}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              variant="outline"
              onClick={onToggleAutoScroll}
              className={`
                rounded-full w-14 h-14 p-0
                shadow-lg border-2
                transition-all duration-300 ease-in-out
                hover:scale-110 active:scale-95
                ${bgClass} ${hoverClass}
                animate-fade-in
              `}
              aria-label={tooltip}
            >
              {icon}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};