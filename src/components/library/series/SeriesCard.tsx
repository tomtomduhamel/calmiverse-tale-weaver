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
      className={`group cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-card border-border/40 hover:border-primary/30 ${className}`}
      onClick={onClick}
    >
      <CardContent className="p-6 space-y-5">
        {/* Header avec image et info principale */}
        <div className="flex gap-5">
          {/* Image de couverture */}
          {coverImage ? (
            <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-muted flex-shrink-0 shadow-md">
              <img 
                src={coverImage} 
                alt={series.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute bottom-2 right-2 bg-background/95 backdrop-blur-sm rounded-full px-2.5 py-1">
                <span className="text-xs font-semibold text-foreground">{totalStories}</span>
              </div>
            </div>
          ) : (
            <div className="w-20 h-28 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex flex-col items-center justify-center flex-shrink-0 shadow-md border border-border/30">
              <BookOpen className="w-8 h-8 text-primary/70 mb-2" />
              <span className="text-xs font-semibold text-primary/70 bg-background/50 px-2 py-0.5 rounded-full">
                {totalStories}
              </span>
            </div>
          )}
          
          {/* Informations de la série */}
          <div className="flex-1 min-w-0 space-y-3">
            {/* Titre et favoris */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-xl leading-tight group-hover:text-primary transition-colors duration-200">
                  {series.title}
                </h3>
                {/* Badge série */}
                <Badge variant="secondary" className="mt-2 text-xs">
                  Série d'histoires
                </Badge>
              </div>
              {hasFavorites && (
                <div className="flex-shrink-0 mt-1">
                  <Star className="w-5 h-5 text-amber-500 fill-current" />
                </div>
              )}
            </div>
            
            {/* Description */}
            <p className="text-sm text-muted-foreground leading-relaxed">
              {series.description || "Une série d'histoires captivantes pour enfants"}
            </p>
          </div>
        </div>

        {/* Métadonnées en ligne */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/30 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary/60" />
            <span className="font-medium">
              {totalStories} {totalStories > 1 ? 'tomes' : 'tome'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary/60" />
            <span>il y a {timeAgo.replace('il y a ', '')}</span>
          </div>
        </div>

        {/* Progression de lecture */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Progression de lecture</span>
            <span className="text-lg font-bold text-foreground">
              {readStories}/{totalStories}
            </span>
          </div>
          <div className="relative">
            <Progress 
              value={progressPercentage} 
              className="h-3 bg-muted/60 rounded-full"
            />
            {progressPercentage > 0 && (
              <div 
                className="absolute top-0 left-0 h-3 bg-gradient-to-r from-primary to-primary/80 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            )}
          </div>
        </div>

        {/* Call to action avec style amélioré */}
        <div className="pt-4 border-t border-border/30">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-primary/90 group-hover:text-primary transition-colors duration-200">
              {readStories === totalStories 
                ? "✓ Série terminée"
                : readStories === 0 
                  ? "→ Commencer la série"
                  : `→ Continuer • Tome ${readStories + 1} en attente`
              }
            </p>
            <span className="text-xs text-muted-foreground group-hover:text-primary/60 transition-colors">
              Cliquer pour parcourir
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};