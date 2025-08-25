import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Clock, Star } from 'lucide-react';
import type { SeriesGroup } from '@/types/story';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SeriesCardProps {
  seriesGroup: SeriesGroup;
  onClick: () => void;
  className?: string;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  seriesGroup,
  onClick,
  className = ""
}) => {
  const { series, stories, totalStories, readStories, lastUpdated, coverImage } = seriesGroup;
  
  const progressPercentage = totalStories > 0 ? (readStories / totalStories) * 100 : 0;
  const timeAgo = formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: fr });
  
  // Vérifier s'il y a des favoris dans la série
  const hasFavorites = stories.some(story => story.isFavorite);

  return (
    <Card 
      className={`group cursor-pointer transition-all duration-300 hover:shadow-md hover:scale-[1.01] bg-card border-border/40 hover:border-primary/30 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-5 space-y-4">
        {/* Header avec image et info */}
        <div className="flex gap-4">
          {coverImage ? (
            <div className="relative w-18 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-sm">
              <img 
                src={coverImage} 
                alt={series.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              <div className="absolute bottom-2 right-2 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1">
                <span className="text-xs font-medium text-foreground">{totalStories}</span>
              </div>
            </div>
          ) : (
            <div className="w-18 h-24 rounded-xl bg-gradient-to-br from-primary/8 to-accent/8 flex flex-col items-center justify-center flex-shrink-0 shadow-sm border border-border/20">
              <BookOpen className="w-7 h-7 text-primary/70 mb-1" />
              <span className="text-xs font-medium text-primary/70">{totalStories}</span>
            </div>
          )}
          
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground line-clamp-2 text-lg group-hover:text-primary transition-colors">
                {series.title}
              </h3>
              {hasFavorites && (
                <Star className="w-4 h-4 text-amber-500 fill-current flex-shrink-0 mt-1" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed">
              {series.description || "Une série d'histoires captivantes"}
            </p>
          </div>
        </div>

        {/* Métadonnées */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="font-medium">{totalStories} {totalStories > 1 ? 'tomes' : 'tome'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{timeAgo}</span>
          </div>
        </div>

        {/* Progression */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Progression de lecture</span>
            <span className="text-sm font-medium text-foreground">
              {readStories}/{totalStories}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2.5 bg-muted/60"
          />
        </div>

        {/* Call to action */}
        <div className="pt-3 border-t border-border/30">
          <p className="text-sm text-primary/90 font-medium group-hover:text-primary transition-colors">
            {readStories === totalStories 
              ? "✓ Série terminée • Cliquer pour parcourir"
              : readStories === 0 
                ? "→ Commencer la série"
                : `→ Continuer • Tome ${readStories + 1} en attente`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};