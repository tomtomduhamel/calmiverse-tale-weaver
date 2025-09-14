import React from 'react';

interface StoryProgressProps {
  progress: number;
  isSubmitting?: boolean;
}

/**
 * Composant de progression simplifié
 * Maintient la compatibilité avec l'API existante
 */
export const StoryProgress = ({ progress, isSubmitting = true }: StoryProgressProps) => {
  if (!isSubmitting) return null;
  
  return (
    <div className="space-y-2 animate-fade-in">
      <div className="text-sm text-muted-foreground">
        Génération en cours... {Math.min(Math.round(progress), 99)}%
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300" 
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>
  );
};

export type { StoryProgressProps };