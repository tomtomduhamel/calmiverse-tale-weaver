import React from 'react';
import { BookOpen } from 'lucide-react';

interface ConstellationWidgetProps {
  totalReads: number;
  objectiveStats: Record<string, number>;
}

export const ConstellationWidget: React.FC<ConstellationWidgetProps> = ({ totalReads, objectiveStats }) => {
  // Sélectionner les 3 objectifs avec le plus de lectures
  const topObjectives = Object.entries(objectiveStats)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="p-6 rounded-2xl bg-white/40 dark:bg-black/40 backdrop-blur-md border border-white/20 dark:border-white/10 shadow-sm relative overflow-hidden h-full min-h-[300px] flex flex-col transition-colors">
      <h3 className="text-xl font-semibold mb-1 flex items-center gap-2 text-foreground dark:text-white">
        <BookOpen className="w-5 h-5 text-primary" />
        L'Amas des Histoires
      </h3>
      <p className="text-sm text-muted-foreground dark:text-white/70 mb-6">Tu as visité {totalReads} mondes différents.</p>
      
      {totalReads === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <div className="w-16 h-16 border-2 border-dashed border-primary/20 dark:border-white/20 rounded-full mb-4 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-foreground dark:text-white">Le ciel est encore vide.<br/>Lis ta première histoire pour allumer l'univers.</p>
        </div>
      ) : (
        <div className="flex-1 relative flex items-center justify-center">
          {/* Dessin rudimentaire d'une constellation en fonction des données */}
          <div className="relative w-full max-w-[250px] aspect-square">
            {/* Lignes reliant les étoiles (svg de fond) */}
            <svg className="absolute inset-0 w-full h-full" overflow="visible">
              <path 
                d="M 125,40 L 40,160 L 210,160 Z" 
                fill="none" 
                stroke="currentColor" 
                className="text-primary/10 dark:text-white/15"
                strokeWidth="1.5" 
                strokeDasharray="4 4" 
              />
              <path 
                d="M 125,40 L 125,110 L 40,160" 
                fill="none" 
                stroke="currentColor"
                className="text-primary/10 dark:text-white/15"
                strokeWidth="1.5" 
              />
            </svg>
            
            {/* Étoile Principale (La plus grande) */}
            <div className="absolute top-[40px] left-[125px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-primary/80 dark:bg-primary/80 shadow-[0_0_15px_rgba(var(--primary),0.5)] dark:shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-pulse-slow"></div>
              {topObjectives[0] && (
                <span className="text-[10px] mt-2 bg-white/80 dark:bg-black/60 text-foreground dark:text-white px-2 py-1 rounded-full whitespace-nowrap border border-primary/10 dark:border-white/10 shadow-sm backdrop-blur-sm">
                  {topObjectives[0][0]} ({topObjectives[0][1]})
                </span>
              )}
            </div>
            
            {/* Étoile Gauche */}
            <div className="absolute top-[160px] left-[40px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-secondary/80 dark:bg-secondary/80 shadow-[0_0_10px_rgba(var(--secondary),0.4)] dark:shadow-[0_0_10px_rgba(var(--secondary),0.6)] animate-pulse-slow delay-150"></div>
              {topObjectives[1] && (
                <span className="text-[10px] mt-2 bg-white/80 dark:bg-black/60 text-foreground dark:text-white px-2 py-1 rounded-full whitespace-nowrap border border-primary/10 dark:border-white/10 shadow-sm backdrop-blur-sm">
                  {topObjectives[1][0]} ({topObjectives[1][1]})
                </span>
              )}
            </div>
            
            {/* Étoile Droite */}
            <div className="absolute top-[160px] left-[210px] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
               <div className="w-6 h-6 rounded-full bg-accent/80 dark:bg-accent/80 shadow-[0_0_12px_rgba(var(--accent),0.5)] dark:shadow-[0_0_12px_rgba(var(--accent),0.7)] animate-pulse-slow delay-300"></div>
               {topObjectives[2] && (
                <span className="text-[10px] mt-2 bg-white/80 dark:bg-black/60 text-foreground dark:text-white px-2 py-1 rounded-full whitespace-nowrap border border-primary/10 dark:border-white/10 shadow-sm backdrop-blur-sm">
                  {topObjectives[2][0]} ({topObjectives[2][1]})
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
