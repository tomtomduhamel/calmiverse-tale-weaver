
import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ErrorStateProps {
  isDarkMode: boolean;
  error: string;
  onReinitialize: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ isDarkMode, error, onReinitialize }) => {
  const baseButtonClass = `rounded-full ${isDarkMode ? "border-gray-600 text-white" : ""}`;

  return (
    <div className="space-y-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1">
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                className={`${baseButtonClass} bg-red-100 dark:bg-red-900/30`}
                aria-label="Erreur de fond sonore"
                disabled
              >
                <AlertCircle className="h-4 w-4 text-red-500" />
              </Button>
              <Button
                variant={isDarkMode ? "outline" : "ghost"}
                size="icon"
                onClick={onReinitialize}
                className={`${baseButtonClass} hover:bg-blue-100 dark:hover:bg-blue-900/30`}
                aria-label="Réessayer le chargement"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="z-[100]">
            <div className="text-xs text-red-500">Erreur de fond sonore</div>
            <div className="text-xs opacity-70">{error}</div>
            <div className="text-xs text-blue-500 mt-1">↻ Réessayer</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
