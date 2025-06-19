
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingToggleButtonProps {
  isVisible: boolean;
  onToggle: () => void;
  isDarkMode?: boolean;
}

export const FloatingToggleButton: React.FC<FloatingToggleButtonProps> = ({
  isVisible,
  onToggle,
  isDarkMode = false
}) => {
  const isMobile = useIsMobile();

  // Ajuster la position pour éviter la superposition avec le bouton de pause sur mobile
  const getPositionStyles = () => {
    if (isMobile) {
      return {
        bottom: '8rem', // Plus haut pour éviter le bouton de pause (qui est à 5rem)
        right: '1rem',   // Plus près du bord sur mobile
      };
    }
    return {
      bottom: '5rem',  // Position normale sur desktop
      right: '1.5rem',
    };
  };

  const handleToggle = (e: React.MouseEvent) => {
    // Empêcher la propagation pour éviter de déclencher la détection d'activité
    e.stopPropagation();
    e.preventDefault();
    onToggle();
  };

  const positionStyles = getPositionStyles();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggle}
            data-toggle-controls="true"
            className={`
              fixed z-50 
              rounded-full w-12 h-12 p-0
              shadow-lg border-2
              transition-all duration-300 ease-in-out
              hover:scale-110 active:scale-95
              ${isDarkMode 
                ? 'bg-gray-800 border-gray-600 text-white hover:bg-gray-700' 
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }
              ${isVisible ? 'translate-y-0' : 'translate-y-2'}
            `}
            style={positionStyles}
            aria-label={isVisible ? "Masquer les contrôles" : "Afficher les contrôles"}
          >
            {isVisible ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronUp className="h-5 w-5" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{isVisible ? "Masquer les contrôles" : "Afficher les contrôles"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
