
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowDown, Pause } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AutoScrollIndicatorProps {
  isAutoScrolling: boolean;
  onToggle: () => void;
  isDarkMode: boolean;
}

export const AutoScrollIndicator: React.FC<AutoScrollIndicatorProps> = ({
  isAutoScrolling,
  onToggle,
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
        onClick={onToggle}
        className={`rounded-full p-3 shadow-lg ${
          isDarkMode 
            ? "bg-gray-800 text-white border-gray-600 hover:bg-gray-700"
            : "bg-primary/10 hover:bg-primary/20"
        }`}
      >
        {isAutoScrolling ? (
          <Pause className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-primary"}`} />
        ) : (
          <ArrowDown className={`h-6 w-6 ${isDarkMode ? "text-white" : "text-primary"}`} />
        )}
      </Button>
    </div>
  );
};
