import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  const { series, stories, totalStories, readStories } = seriesGroup;
  const progressPercentage = totalStories > 0 ? (readStories / totalStories) * 100 : 0;

  const handleStorySelect = (story: Story) => {
    onSelectStory(story);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <DialogTitle className="text-2xl font-semibold text-foreground">
                {series.title}
              </DialogTitle>
              
              {series.description && (
                <p className="text-muted-foreground leading-relaxed">
                  {series.description}
                </p>
              )}
              
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {totalStories} {totalStories > 1 ? 'tomes' : 'tome'}
                </Badge>
                
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    Progression:
                  </span>
                  <div className="flex-1 max-w-32">
                    <Progress value={progressPercentage} className="h-2" />
                  </div>
                  <span className="text-sm font-medium text-foreground whitespace-nowrap">
                    {readStories}/{totalStories}
                  </span>
                </div>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground mb-4">
              Histoires de la série
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              {stories.map((story) => (
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
                />
              ))}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};