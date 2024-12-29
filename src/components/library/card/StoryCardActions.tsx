import React from "react";
import { Button } from "@/components/ui/button";
import { Star, Trash2, BookCheck } from "lucide-react";

interface StoryCardActionsProps {
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onMarkAsRead: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
  isRead: boolean;
}

const StoryCardActions: React.FC<StoryCardActionsProps> = ({
  isFavorite,
  onToggleFavorite,
  onMarkAsRead,
  onDelete,
  isRead,
}) => {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 text-yellow-500 hover:text-yellow-600 bg-white/80 hover:bg-white/90 ${
          isFavorite ? 'text-yellow-500' : 'text-gray-400'
        }`}
        onClick={onToggleFavorite}
      >
        <Star className="h-4 w-4" fill={isFavorite ? "currentColor" : "none"} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 bg-white/80 hover:bg-white/90 ${
          isRead ? 'text-green-600' : 'text-secondary hover:text-secondary/90'
        }`}
        onClick={onMarkAsRead}
      >
        <BookCheck className="h-4 w-4" fill={isRead ? "currentColor" : "none"} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-secondary hover:text-destructive bg-white/80 hover:bg-white/90"
        onClick={onDelete}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default StoryCardActions;