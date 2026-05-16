import React from 'react';
import type { Story } from '@/types/story';
import { SeriesStoryCard } from './SeriesStoryCard';

interface SeriesTimelineProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onDeleteStory?: (storyId: string) => void;
  onRetryStory?: (storyId: string) => void;
  isUpdatingFavorite?: boolean;
  isDeletingId?: string | null;
  isRetrying?: boolean;
}

/**
 * Timeline visuelle pour afficher la progression dans une série d'histoires
 * Montre clairement quelles histoires sont lues, en cours, ou à venir
 */
export const SeriesTimeline: React.FC<SeriesTimelineProps> = ({
  stories,
  onSelectStory,
  onToggleFavorite,
  onDeleteStory,
  onRetryStory,
  isUpdatingFavorite,
  isDeletingId,
  isRetrying
}) => {
  // Trier les histoires par tome_number
  const sortedStories = [...stories].sort((a, b) => {
    const tomeA = a.tome_number || 0;
    const tomeB = b.tome_number || 0;
    return tomeA - tomeB;
  });

  // Déterminer quelle est la prochaine histoire recommandée à lire
  const getNextRecommended = (): string | null => {
    // Trouver la première histoire non lue
    const firstUnread = sortedStories.find(s => s.status !== 'read');
    return firstUnread?.id || null;
  };

  const nextRecommendedId = getNextRecommended();

  return (
    <div className="space-y-4">
      {sortedStories.map((story, index) => {
        const isLastTome = index === sortedStories.length - 1;
        const isNextToRead = story.id === nextRecommendedId;
        
        return (
          <div key={story.id} className="flex gap-4 items-start">
            {/* Timeline verticale avec indicateur de progression */}
            <div className="flex flex-col items-center pt-2">
              {/* Cercle de statut */}
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold
                transition-all duration-300 shadow-sm
                ${story.status === 'completed' || story.status === 'ready' 
                  ? 'bg-accent text-accent-foreground ring-2 ring-accent/40' 
                  : ''
                }
                ${story.status === 'pending' 
                  ? 'bg-primary-soft text-primary-foreground animate-glow-pulse ring-2 ring-primary-soft/40' 
                  : ''
                }
                ${story.status === 'read' 
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30' 
                  : ''
                }
                ${story.status === 'error' 
                  ? 'bg-destructive text-destructive-foreground ring-2 ring-destructive/30' 
                  : ''
                }
                ${isNextToRead && story.status !== 'read'
                  ? 'ring-4 ring-primary/40 scale-110'
                  : ''
                }
              `}>
                {story.tome_number || index + 1}
              </div>
              
              {/* Ligne de connexion entre les histoires */}
              {!isLastTome && (
                <div className={`
                  w-0.5 h-16 my-1 transition-colors duration-300
                  ${story.status === 'read' 
                    ? 'bg-primary' 
                    : 'bg-border'
                  }
                `} />
              )}
            </div>
            
            {/* Carte de l'histoire */}
            <div className="flex-1 pb-4">
              <SeriesStoryCard 
                story={story}
                onClick={() => onSelectStory(story)}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDeleteStory}
                onRetry={onRetryStory}
                isUpdatingFavorite={isUpdatingFavorite && story.id === isDeletingId}
                isDeleting={!!isDeletingId && isDeletingId === story.id}
                isRetrying={isRetrying}
                isNextRecommended={isNextToRead}
                className="h-full"
              />
              
              {/* Badge "À lire ensuite" si c'est la prochaine recommandée */}
              {isNextToRead && story.status !== 'read' && (
                <div className="mt-2 flex items-center gap-2 text-sm text-primary">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="font-medium">Prochaine histoire recommandée</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Message de fin de série */}
      {sortedStories.length > 0 && sortedStories.every(s => s.status === 'read') && (
        <div className="flex gap-4 items-center pt-4 border-t border-border">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <span className="text-2xl">🎉</span>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Série terminée !
            </p>
            <p className="text-xs text-muted-foreground">
              Vous avez lu toutes les histoires de cette série
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
