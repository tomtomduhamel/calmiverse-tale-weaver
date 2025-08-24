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
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-gradient-to-br from-background to-muted/20 border-border/50 hover:border-primary/20 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-4">
        {/* Header avec image et info */}
        <div className="flex gap-3">
          {coverImage ? (
            <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <img 
                src={coverImage} 
                alt={series.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
          ) : (
            <div className="w-16 h-20 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6 text-primary/60" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                {series.title}
              </h3>
              {hasFavorites && (
                <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
              )}
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {series.description || "Une série d'histoires captivantes"}
            </p>
          </div>
        </div>

        {/* Badges et métadonnées */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
            <BookOpen className="w-3 h-3 mr-1" />
            {totalStories} {totalStories > 1 ? 'tomes' : 'tome'}
          </Badge>
          
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {timeAgo}
          </Badge>
        </div>

        {/* Progression */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Progression</span>
            <span className="text-foreground font-medium">
              {readStories}/{totalStories}
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className="h-2 bg-muted"
          />
        </div>

        {/* Call to action */}
        <div className="pt-2 border-t border-border/50">
          <p className="text-sm text-primary font-medium group-hover:text-primary/80 transition-colors">
            {readStories === totalStories 
              ? "Série terminée • Cliquer pour revoir"
              : readStories === 0 
                ? "Commencer la série"
                : "Continuer la lecture"
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};