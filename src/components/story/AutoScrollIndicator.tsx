
import React from 'react';
import { Button } from "@/components/ui/button";
import { Pause, Play } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AutoScrollIndicatorProps {
  isAutoScrolling: boolean;
  isPaused: boolean;
  onPauseScroll: () => void;
  onResumeScroll: () => void;
  isDarkMode: boolean;
}

export const AutoScrollIndicator: React.FC<AutoScrollIndicatorProps> = ({
  isAutoScrolling,
  isPaused,
  onPauseScroll,
  onResumeScroll,
  isDarkMode
}) => {
  const isMobile = useIsMobile();
  
  // Calculer la position bottom en fonction de la présence du menu mobile
  const bottomPosition = isMobile ? '5rem' : '2rem';
  
  // Si l'auto-scroll n'est pas actif ou est déjà en pause, ne pas afficher l'indicateur
  if (!isAutoScrolling || isPaused) {
    return null;
  }
  
  return (
    <div 
      className={`fixed right-8 z-50 transition-all duration-300 opacity-70 hover:opacity-100 animate-fade-in`}
      style={{ bottom: bottomPosition }}
    >
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="lg"
              variant={isDarkMode ? "outline" : "secondary"}
              onPointerDown={onPauseScroll}  // Maintenir appuyé pour pauser
              onPointerUp={onResumeScroll}   // Relâcher pour reprendre
              onPointerLeave={onResumeScroll}
              onTouchStart={onPauseScroll}   // Support tactile
              onTouchEnd={onResumeScroll}
              className={`rounded-full p-3 shadow-lg active:scale-95 transition-transform ${
                isDarkMode 
                  ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700 active:bg-gray-600"
                  : "bg-primary/10 hover:bg-primary/20 active:bg-primary/30"
              }`}
              aria-label="Maintenir pour pauser le défilement"
            >
              <Pause className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-primary"}`} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Maintenez pour pause rapide</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
