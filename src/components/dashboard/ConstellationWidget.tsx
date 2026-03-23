import React from 'react';
import { BookOpen } from 'lucide-react';
import { getPoeticObjectiveName } from '@/utils/objectiveTranslations';

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
      <div className="mb-6">
        <p className="text-sm text-slate-600 dark:text-white/80 leading-relaxed">
          Parmi tes <span className="font-bold text-primary dark:text-yellow-300">{totalReads} expéditions</span> au total, voici les 3 mondes où tu aimes le plus voyager :
        </p>
      </div>
      
      {totalReads === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
          <div className="w-16 h-16 border-2 border-dashed border-primary/20 dark:border-white/20 rounded-full mb-4 flex items-center justify-center">
            <span className="text-2xl">✨</span>
          </div>
          <p className="text-foreground dark:text-white">Le ciel est encore vide.<br/>Lis ta première histoire pour allumer l'univers.</p>
        </div>
      ) : (
        <div className="flex-1 flex justify-center items-end gap-2 sm:gap-6 w-full pb-4">
          
          {/* Troisième place (À gauche) */}
          {topObjectives[2] && (
            <div className="flex flex-col items-center gap-2 pb-2">
              <span className="text-[10px] text-muted-foreground dark:text-white/60 font-medium">{topObjectives[2][1]} voyage{topObjectives[2][1] > 1 ? 's' : ''}</span>
              <div className="w-5 h-5 rounded-full bg-accent/80 shadow-[0_0_8px_rgba(var(--accent),0.5)] animate-pulse-slow delay-300"></div>
              <span className="text-[10px] sm:text-xs text-center text-foreground dark:text-white font-medium max-w-[80px] leading-tight">
                {getPoeticObjectiveName(topObjectives[2][0])}
              </span>
            </div>
          )}
          
          {/* Première place (Au centre, plus haut et plus gros) */}
          {topObjectives[0] && (
            <div className="flex flex-col items-center gap-2 mb-8">
              <span className="text-xs text-primary dark:text-yellow-300 font-bold">{topObjectives[0][1]} voyage{topObjectives[0][1] > 1 ? 's' : ''}</span>
              <div className="w-10 h-10 rounded-full bg-primary/80 shadow-[0_0_15px_rgba(var(--primary),0.6)] animate-pulse-slow"></div>
              <span className="text-xs sm:text-sm text-center text-foreground dark:text-white font-bold border-b border-primary/30 pb-1 px-2 max-w-[120px] leading-tight">
                {getPoeticObjectiveName(topObjectives[0][0])}
              </span>
            </div>
          )}

          {/* Deuxième place (À droite) */}
          {topObjectives[1] && (
            <div className="flex flex-col items-center gap-2 pb-4">
              <span className="text-[10px] sm:text-xs text-secondary dark:text-secondary-foreground font-semibold">{topObjectives[1][1]} voyage{topObjectives[1][1] > 1 ? 's' : ''}</span>
              <div className="w-7 h-7 rounded-full bg-secondary/80 shadow-[0_0_12px_rgba(var(--secondary),0.5)] animate-pulse-slow delay-150"></div>
              <span className="text-[10px] sm:text-xs text-center text-foreground dark:text-white font-medium max-w-[80px] leading-tight">
                {getPoeticObjectiveName(topObjectives[1][0])}
              </span>
            </div>
          )}
          
        </div>
      )}
    </div>
  );
};
