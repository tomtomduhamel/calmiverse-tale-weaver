import React, { useState } from "react";
import { Trash2, BookCheck, Video, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Story } from "@/types/story";
import DeleteStoryDialog from "../DeleteStoryDialog";
import { CreateSequelButton } from "../../story/series/CreateSequelButton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useStoryVideoGeneration } from "@/hooks/stories/useStoryVideoGeneration";

interface StoryCardActionsProps {
  story: Story;
  onDelete?: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
  onSequelCreated?: (storyId: string) => void;
  seriesStories?: Story[];
}
const StoryCardActions: React.FC<StoryCardActionsProps> = ({
  story,
  onDelete,
  onRetry,
  isRetrying = false,
  isDeleting = false,
  onSequelCreated,
  seriesStories = []
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { generateVideoForStory, isGeneratingVideo } = useStoryVideoGeneration();
  const isGeneratingThisVideo = isGeneratingVideo(story.id);

  const handleDeleteClick = React.useCallback((e: React.MouseEvent) => {
    console.log("[StoryCardActions] DEBUG: Clic sur suppression pour histoire:", story.id);
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  }, [story.id]);

  const handleGenerateVideoClick = React.useCallback(async (e: React.MouseEvent) => {
    console.log("[StoryCardActions] Clic sur génération vidéo pour histoire:", story.id);
    e.preventDefault();
    e.stopPropagation();
    await generateVideoForStory(story);
  }, [generateVideoForStory, story]);

  const handleConfirmDelete = React.useCallback(async () => {
    console.log("[StoryCardActions] DEBUG: Confirmation de suppression pour histoire:", story.id);
    // Fermer le dialog AVANT la suppression pour éviter toute propagation d'événement
    setShowDeleteDialog(false);
    if (onDelete) {
      // Petit délai pour s'assurer que le dialog est fermé avant la suppression
      await new Promise(resolve => setTimeout(resolve, 50));
      await onDelete();
    }
  }, [onDelete, story.id]);

  const handleCloseDialog = React.useCallback(() => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  }, [isDeleting]);

  // Déterminer si on peut créer une suite
  const canCreateSequel = (story.status === 'ready' || story.status === 'read' || story.status === 'completed') && !story.next_story_id;
  const isCompleted = story.status === 'ready' || story.status === 'read' || story.status === 'completed';

  return (
    <>
      <div className="flex flex-col gap-1">
        {/* Bouton créer une suite intelligent */}
        {canCreateSequel && onSequelCreated && (
          <div className="flex justify-end" data-sequel-button onClick={(e) => e.stopPropagation()}>
            <CreateSequelButton
              story={story}
              seriesStories={seriesStories}
              onSequelCreated={onSequelCreated}
              disabled={isDeleting || isRetrying}
              variant="ghost"
              size="sm"
            />
          </div>
        )}

        <div className="flex items-center space-x-2 justify-end">
          {/* Bouton générer vidéo magique si absente */}
          {!story.video_path && isCompleted && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleGenerateVideoClick}
                    disabled={isDeleting || isRetrying || isGeneratingThisVideo}
                    className={cn(
                      "p-1.5 rounded-full text-primary hover:bg-primary/10 transition-colors duration-300 ease-calm",
                      isGeneratingThisVideo && "animate-pulse"
                    )}
                    aria-label="Créer la vidéo magique"
                    type="button"
                  >
                    {isGeneratingThisVideo ? (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isGeneratingThisVideo ? "Génération de la vidéo..." : "Créer la vidéo magique"}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Badge Lu à côté de la poubelle (desktop) */}
          {story.status === 'read' && (
            <Badge variant="outline" className="hidden md:flex text-accent-foreground border-accent/40 bg-accent/20">
              <BookCheck className="h-3 w-3 mr-1" />
              Lu
            </Badge>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting || isRetrying}
                  className={cn(
                    "p-1.5 rounded-full text-destructive hover:bg-destructive/10 transition-colors duration-300 ease-calm",
                    isDeleting && "cursor-not-allowed opacity-50"
                  )}
                  aria-label="Supprimer l'histoire"
                  type="button"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isDeleting ? "Suppression en cours..." : "Supprimer l'histoire"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <DeleteStoryDialog
        story={story}
        isOpen={showDeleteDialog}
        isDeleting={isDeleting}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};

export default React.memo(StoryCardActions);
