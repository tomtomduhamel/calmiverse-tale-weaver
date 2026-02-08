import React, { useState } from "react";
import { Trash2, BookCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Story } from "@/types/story";
import { Loader2 } from "lucide-react";
import DeleteStoryDialog from "../DeleteStoryDialog";
import { CreateSequelButton } from "../../story/series/CreateSequelButton";
import { Badge } from "@/components/ui/badge";

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

  const handleDeleteClick = React.useCallback((e: React.MouseEvent) => {
    console.log("[StoryCardActions] DEBUG: Clic sur suppression pour histoire:", story.id);
    e.preventDefault();
    e.stopPropagation();
    setShowDeleteDialog(true);
  }, [story.id]);

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
          {/* Badge Lu à côté de la poubelle (desktop) */}
          {story.status === 'read' && (
            <Badge variant="outline" className="hidden md:flex text-green-600 border-green-200 bg-green-50 dark:bg-green-500/10 dark:border-green-500/30">
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
                  className={`p-1.5 rounded-full text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 ${isDeleting ? "cursor-not-allowed opacity-50" : ""
                    }`}
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
