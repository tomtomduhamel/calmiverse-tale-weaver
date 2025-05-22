
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowDown, Pause } from 'lucide-react';

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
  return (
    <div 
      className={`fixed bottom-8 right-8 z-50 transition-opacity duration-300 opacity-70 hover:opacity-100`}
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
