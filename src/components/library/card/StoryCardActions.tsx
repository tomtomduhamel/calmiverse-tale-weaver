
import React from "react";
import { Trash2, RefreshCw, Share, Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Story } from "@/types/story";

interface StoryCardActionsProps {
  storyId: string;
  onDelete: (e: React.MouseEvent) => void;
  onRetry?: (e: React.MouseEvent) => void;
  onToggleFavorite?: (e: React.MouseEvent) => void;
  onShare?: (e: React.MouseEvent) => void;
  isFavorite?: boolean;
  status: Story['status'];
  isRetrying?: boolean;
}

const StoryCardActions: React.FC<StoryCardActionsProps> = ({
  onDelete,
  onRetry,
  onToggleFavorite,
  onShare,
  isFavorite = false,
  status,
  isRetrying = false,
}) => {
  return (
    <div
      className="flex justify-end space-x-2 mt-2"
      onClick={(e) => e.stopPropagation()}
    >
      {onShare && (
        <Button variant="ghost" size="sm" onClick={onShare}>
          <Share className="h-4 w-4 text-gray-500 hover:text-blue-500" />
        </Button>
      )}
      
      {onToggleFavorite && (
        <Button variant="ghost" size="sm" onClick={onToggleFavorite}>
          {isFavorite ? (
            <StarOff className="h-4 w-4 text-amber-500 hover:text-amber-600" />
          ) : (
            <Star className="h-4 w-4 text-gray-500 hover:text-amber-500" />
          )}
        </Button>
      )}
      
      {status === 'error' && onRetry && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onRetry}
          disabled={isRetrying}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span className="sr-only">Réessayer</span>
        </Button>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onDelete}
        className="text-red-500 hover:text-red-600 hover:bg-red-50"
      >
        <Trash2 className="h-4 w-4" />
        <span className="sr-only">Supprimer</span>
      </Button>
    </div>
  );
};

export default StoryCardActions;
