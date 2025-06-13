
import React, { useState } from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Story } from "@/types/story";
import { Loader2 } from "lucide-react";
import DeleteStoryDialog from "../DeleteStoryDialog";

interface StoryCardActionsProps {
  story: Story;
  onDelete?: () => void;
  onRetry?: () => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
}

const StoryCardActions: React.FC<StoryCardActionsProps> = ({ 
  story, 
  onDelete, 
  onRetry,
  isRetrying = false,
  isDeleting = false
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
    if (onDelete) {
      await onDelete();
    }
    setShowDeleteDialog(false);
  }, [onDelete, story.id]);

  const handleRetry = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onRetry) onRetry();
  }, [onRetry]);

  const handleCloseDialog = React.useCallback(() => {
    if (!isDeleting) {
      setShowDeleteDialog(false);
    }
  }, [isDeleting]);

  return (
    <>
      <div className="flex space-x-1">
        <TooltipProvider>
          {story.status === "error" && onRetry && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleRetry}
                  disabled={isRetrying || isDeleting}
                  className={`p-1.5 rounded-full text-amber-600 hover:bg-amber-100 ${
                    isRetrying ? "cursor-not-allowed opacity-50" : ""
                  }`}
                  aria-label="Réessayer cette histoire"
                  type="button"
                >
                  {isRetrying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isRetrying ? "Nouvelle tentative en cours..." : "Réessayer la génération"}</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting || isRetrying}
                className={`p-1.5 rounded-full text-red-600 hover:bg-red-100 ${
                  isDeleting ? "cursor-not-allowed opacity-50" : ""
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
