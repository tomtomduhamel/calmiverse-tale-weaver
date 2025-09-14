import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingStoryProps {
  message?: string;
  progress?: number;
}

/**
 * Composant de chargement simple et léger
 * Remplace l'ancien système d'attente bloquant
 */
const LoadingStory = ({ message = "Chargement...", progress }: LoadingStoryProps) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4" data-testid="loading-story">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">{message}</p>
        {typeof progress === 'number' && (
          <div className="w-full max-w-md">
            <div className="bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300" 
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingStory;