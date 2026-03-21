import React from 'react';
import { Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakIndicatorProps {
  currentStreak: number;
}

export const StreakIndicator: React.FC<StreakIndicatorProps> = ({ currentStreak }) => {
  const hasStreak = currentStreak > 0;
  
  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-6 rounded-2xl backdrop-blur-md border shadow-sm transition-all duration-500 overflow-hidden relative",
      hasStreak 
        ? "bg-primary/10 border-primary/20 dark:bg-primary/20 dark:border-primary/30" 
        : "bg-white/50 border-white/20 dark:bg-black/20 dark:border-white/10"
    )}>
      {hasStreak && (
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/20 blur-2xl rounded-full"></div>
      )}
      
      <div className="flex items-center gap-3 mb-2">
        {hasStreak ? (
          <Flame className="w-8 h-8 text-orange-500 dark:text-yellow-400 animate-pulse" />
        ) : (
          <Star className="w-8 h-8 text-muted-foreground/50" />
        )}
        <span className={cn(
          "text-4xl font-black",
          hasStreak 
            ? "text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-primary dark:from-yellow-300 dark:to-primary" 
            : "text-muted-foreground"
        )}>
          {currentStreak}
        </span>
      </div>
      
      <p className="text-sm text-center text-foreground font-medium z-10 dark:text-white/90">
        {currentStreak === 0 
          ? "Lis une histoire pour commencer ta série céleste !" 
          : currentStreak === 1
            ? "Première étoile allumée ! Reviens demain."
            : `Jours consécutifs ! Ton ciel brille de mille feux.`}
      </p>
    </div>
  );
};
