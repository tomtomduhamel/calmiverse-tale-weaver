
import React from "react";
import { Trash2, RefreshCw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { Story } from "@/types/story";
import { Loader2 } from "lucide-react";

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
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.();
  };

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry?.();
  };

  return (
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
              onClick={handleDelete}
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
  );
};

export default StoryCardActions;
