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

  // Déterminer l'icône et l'état visuel — tokens design system
  const getButtonState = () => {
    if (isAutoScrolling) {
      return {
        icon: <Pause className="h-5 w-5" />,
        tooltip: "Arrêter le défilement",
        bgClass: "bg-primary/20 border-primary-soft/50 text-primary",
        hoverClass: "hover:bg-primary/30"
      };
    } else if (isPaused || isManuallyPaused) {
      return {
        icon: <Play className="h-5 w-5" />,
        tooltip: "Reprendre le défilement",
        bgClass: "bg-accent/30 border-accent/50 text-accent-foreground",
        hoverClass: "hover:bg-accent/40"
      };
    } else {
      return {
        icon: <ArrowDown className="h-5 w-5" />,
        tooltip: "Démarrer le défilement",
        bgClass: "bg-background/70 backdrop-blur-xl border-primary-soft/30 text-foreground",
        hoverClass: "hover:bg-background/85"
      };
    }
  };

  const { icon, tooltip, bgClass, hoverClass } = getButtonState();

  // Position adaptée selon l'appareil pour éviter la superposition avec les contrôles
  const getPositionStyles = () => {
    if (isMobile) {
      return {
        bottom: '8.5rem', // Même hauteur que le toggle button pour éviter overlap avec les contrôles
        right: '1rem',    // Côté droit sur mobile
      };
    }
    return {
      bottom: '5rem',     // Même niveau que le toggle button sur desktop
      left: '2rem',       // Côté gauche sur desktop
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
                shadow-floating border
                transition-all duration-400 ease-calm
                hover:scale-105 active:scale-95
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