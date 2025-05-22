
import React from 'react';
import { Button } from "@/components/ui/button";
import { Pause } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AutoScrollIndicatorProps {
  isAutoScrolling: boolean;
  onPauseScroll: () => void;
  onResumeScroll: () => void;
  isDarkMode: boolean;
}

export const AutoScrollIndicator: React.FC<AutoScrollIndicatorProps> = ({
  isAutoScrolling,
  onPauseScroll,
  onResumeScroll,
  isDarkMode
}) => {
  const isMobile = useIsMobile();
  
  // Calculer la position bottom en fonction de la présence du menu mobile
  const bottomPosition = isMobile ? '5rem' : '2rem';
  
  return (
    <div 
      className={`fixed right-8 z-55 transition-opacity duration-300 opacity-70 hover:opacity-100`}
      style={{ bottom: bottomPosition }}
    >
      <Button
        size="lg"
        variant={isDarkMode ? "outline" : "secondary"}
        onPointerDown={onPauseScroll}  // Maintenir appuyé pour pauser
        onPointerUp={onResumeScroll}   // Relâcher pour reprendre
        onPointerLeave={onResumeScroll}
        className={`rounded-full p-3 shadow-lg active:scale-95 transition-transform ${
          isDarkMode 
            ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700 active:bg-gray-600"
            : "bg-primary/10 hover:bg-primary/20 active:bg-primary/30"
        }`}
        aria-label="Maintenir pour pauser le défilement"
      >
        <Pause className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-primary"}`} />
      </Button>
    </div>
  );
};
