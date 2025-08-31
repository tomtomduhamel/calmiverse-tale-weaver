import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, X, Star, Plus, Clock, ChevronDown, ChevronUp, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStoryImageUrl } from '@/utils/supabaseImageUtils';
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

  // Version mobile optimisée - tout visible sans scroll
  if (isMobile) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[98vw] max-h-[96vh] min-h-[96vh] p-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-hidden flex flex-col">
          {/* Header mobile ultra-compact */}
          <DialogHeader className="p-3 pb-2 border-b border-border/40 flex-shrink-0">
            <div className="space-y-2">
              {/* Titre et infos principales */}
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-border/20">
                    <BookOpen className="w-4 h-4 text-primary/70" />
                  </div>
                  {hasFavorites && <Star className="w-2.5 h-2.5 text-amber-500 fill-current absolute -top-0.5 -right-0.5" />}
                </div>
                
                <div className="flex-1 min-w-0">
                  <DialogTitle className="text-base font-semibold text-foreground leading-tight line-clamp-2 text-left">
                    {series.title}
                  </DialogTitle>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{totalStories} tome{totalStories > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>{lastUpdateDate.toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              </div>

              {/* Progression mobile ultra-compact */}
              <div className="bg-muted/30 rounded-md p-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Progression</span>
                  <span>{readStories}/{totalStories} ({Math.round(progressPercentage)}%)</span>
                </div>
                <Progress value={progressPercentage} className="h-1.5 bg-muted/60" />
              </div>

              {/* Description mobile compacte */}
              {series.description && (
                <div className="text-xs text-muted-foreground/90 leading-tight line-clamp-2">
                  {series.description}
                </div>
              )}
            </div>
          </DialogHeader>

          {/* Section tomes - header compact */}
          <div className="px-3 py-2 border-b border-border/20 flex items-center justify-between bg-muted/20 flex-shrink-0">
            <h3 className="text-sm font-semibold text-foreground">
              Tomes de la série
            </h3>
            <Button variant="outline" size="sm" className="gap-1 h-7 px-2 text-xs">
              <Plus className="w-3 h-3" />
              Suite
            </Button>
          </div>

          {/* Contenu des tomes - optimisé pour mobile */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-2">
              {stories.map((story, index) => (
                <Card 
                  key={story.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-sm hover:border-primary/20 ${
                    index === readStories && story.status !== 'read' ? 'ring-1 ring-primary/30 bg-primary/5' : ''
                  }`}
                  onClick={() => handleStorySelect(story)}
                >
                  <CardContent className="p-3">
                    <div className="flex gap-2.5">
                      {/* Image compacte */}
                      {story.image_path ? (
                        <div className="w-9 h-12 rounded-sm overflow-hidden bg-muted flex-shrink-0">
                          <img 
                            src={getStoryImageUrl(story.image_path) || ''} 
                            alt={story.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-9 h-12 rounded-sm bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                          <BookOpen className="w-3 h-3 text-primary/60" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        {/* Header avec tome et statut */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {story.tome_number && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                                Tome {story.tome_number}
                              </Badge>
                            )}
                            {story.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                            {story.status === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
                            {story.status === 'error' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                          </div>
                          
                          {/* Indicateur de lecture recommandée */}
                          {index === readStories && story.status !== 'read' && (
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 px-1.5 py-0 h-5">
                              À lire
                            </Badge>
                          )}
                        </div>
                        
                        {/* Titre compact */}
                        <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                          {story.title}
                        </h4>
                        
                        {/* Métadonnées compactes */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          {story.status === 'completed' && (
                            <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-1.5 py-0 h-4 text-xs">
                              Prête
                            </Badge>
                          )}
                          {story.status === 'pending' && (
                            <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-1.5 py-0 h-4 text-xs">
                              En cours
                            </Badge>
                          )}
                          {story.status === 'error' && (
                            <Badge variant="destructive" className="px-1.5 py-0 h-4 text-xs">
                              Erreur
                            </Badge>
                          )}
                          <span className="ml-auto">
                            {formatDistanceToNow(story.createdAt, { addSuffix: true, locale: fr })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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