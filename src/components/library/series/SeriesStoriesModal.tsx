import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, X, Star, Plus, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import type { SeriesGroup, Story } from '@/types/story';
import { SeriesStoryCard } from './SeriesStoryCard';

interface SeriesStoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  seriesGroup: SeriesGroup;
  onSelectStory: (story: Story) => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onDeleteStory?: (storyId: string) => void;
  onRetryStory?: (storyId: string) => void;
  isUpdatingFavorite?: boolean;
  isDeletingId?: string | null;
  isRetrying?: boolean;
  pendingStoryId?: string | null;
}

export const SeriesStoriesModal: React.FC<SeriesStoriesModalProps> = ({
  isOpen,
  onClose,
  seriesGroup,
  onSelectStory,
  onToggleFavorite,
  onDeleteStory,
  onRetryStory,
  isUpdatingFavorite,
  isDeletingId,
  isRetrying,
  pendingStoryId
}) => {
  const isMobile = useIsMobile();
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  const {
    series,
    stories,
    totalStories,
    readStories
  } = seriesGroup;

  const progressPercentage = totalStories > 0 ? readStories / totalStories * 100 : 0;

  const handleStorySelect = (story: Story) => {
    onSelectStory(story);
    onClose();
  };

  const hasFavorites = stories.some(story => story.isFavorite);
  const lastUpdateDate = new Date(seriesGroup.lastUpdated);

  // Version mobile complètement repensée
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden flex flex-col">
          {/* Header mobile compact */}
          <DialogHeader className="p-4 pb-3 border-b border-border/40 flex-shrink-0">
            <div className="space-y-3">
              {/* Titre et infos principales */}
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-border/20">
                    <BookOpen className="w-5 h-5 text-primary/70" />
                  </div>
                  {hasFavorites && <Star className="w-3 h-3 text-amber-500 fill-current absolute -top-1 -right-1" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-lg font-semibold text-foreground leading-tight">
                    {series.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span>{totalStories} tome{totalStories > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{lastUpdateDate.toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progression mobile */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                  <span>Progression</span>
                  <span>{readStories}/{totalStories} ({Math.round(progressPercentage)}%)</span>
                </div>
                <Progress value={progressPercentage} className="h-2 bg-muted/60" />
              </div>

              {/* Description mobile avec expand/collapse */}
              {series.description && (
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground/90 leading-relaxed">
                    {showFullDescription 
                      ? series.description 
                      : `${series.description.slice(0, 120)}${series.description.length > 120 ? '...' : ''}`
                    }
                  </div>
                  {series.description.length > 120 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-0 text-xs text-primary"
                      onClick={() => setShowFullDescription(!showFullDescription)}
                    >
                      {showFullDescription ? (
                        <>
                          <ChevronUp className="w-3 h-3 mr-1" />
                          Réduire
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-3 h-3 mr-1" />
                          Lire la suite
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Contenu scrollable mobile */}
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    Tomes de la série
                  </h3>
                  <Button variant="outline" size="sm" className="gap-1 h-8 px-3 text-xs">
                    <Plus className="w-3 h-3" />
                    Suite
                  </Button>
                </div>
                
                {/* Grid mobile : une seule colonne */}
                <div className="grid gap-3">
                  {stories.map((story, index) => (
                    <SeriesStoryCard 
                      key={story.id} 
                      story={story} 
                      onClick={() => handleStorySelect(story)} 
                      onToggleFavorite={onToggleFavorite} 
                      onDelete={onDeleteStory} 
                      onRetry={onRetryStory} 
                      isUpdatingFavorite={isUpdatingFavorite} 
                      isDeleting={isDeletingId === story.id} 
                      isRetrying={isRetrying && pendingStoryId === story.id} 
                      isNextRecommended={index === readStories && story.status !== 'read'}
                    />
                  ))}
                </div>

                {/* Espacement pour éviter que le dernier élément soit coupé */}
                <div className="h-4"></div>
              </div>
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Version desktop (inchangée)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <DialogHeader className="p-6 pb-5 border-b border-border/40">
          <div className="flex items-start justify-between gap-6">
            <div className="flex-1 space-y-4">
              <div className="flex items-start gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-border/20">
                    <BookOpen className="w-6 h-6 text-primary/70" />
                  </div>
                  {hasFavorites && <Star className="w-4 h-4 text-amber-500 fill-current absolute -top-1 -right-1" />}
                </div>
                
                <div className="space-y-1">
                  <DialogTitle className="text-2xl font-semibold text-foreground leading-tight">
                    {series.title}
                  </DialogTitle>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{totalStories} {totalStories > 1 ? 'tomes' : 'tome'}</span>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Mis à jour {lastUpdateDate.toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {series.description && (
                <p className="text-muted-foreground/90 leading-relaxed max-w-2xl">
                  {series.description}
                </p>
              )}
              
              <div className="flex items-center gap-4 bg-muted/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Progression de lecture:</span>
                </div>
                <div className="flex-1 flex items-center gap-3">
                  <Progress value={progressPercentage} className="h-2.5 flex-1 max-w-48 bg-muted/60" />
                  <span className="text-sm font-semibold text-foreground min-w-fit">
                    {readStories}/{totalStories}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({Math.round(progressPercentage)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                Tomes de la série
              </h3>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Créer une suite
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {stories.map((story, index) => (
                <SeriesStoryCard 
                  key={story.id} 
                  story={story} 
                  onClick={() => handleStorySelect(story)} 
                  onToggleFavorite={onToggleFavorite} 
                  onDelete={onDeleteStory} 
                  onRetry={onRetryStory} 
                  isUpdatingFavorite={isUpdatingFavorite} 
                  isDeleting={isDeletingId === story.id} 
                  isRetrying={isRetrying && pendingStoryId === story.id} 
                  isNextRecommended={index === readStories && story.status !== 'read'}
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};