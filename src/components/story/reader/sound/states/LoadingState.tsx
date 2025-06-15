
import React from 'react';
import { Button } from "@/components/ui/button";
import { Disc } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface LoadingStateProps {
  isDarkMode: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ isDarkMode }) => {
  const baseButtonClass = `rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""}`;
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isDarkMode ? "outline" : "ghost"}
            size="icon"
            className={baseButtonClass}
            disabled
          >
            <Disc className="h-4 w-4 animate-spin" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="z-[100]">
          <div className="text-xs">Chargement du fond sonore...</div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
