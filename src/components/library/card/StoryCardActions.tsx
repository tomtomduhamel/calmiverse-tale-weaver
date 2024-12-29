import React from "react";
import { Button } from "@/components/ui/button";
import { Star, Edit2, Trash2, Check } from "lucide-react";

interface StoryCardActionsProps {
  isEditing: boolean;
  isFavorite: boolean;
  onToggleFavorite: (e: React.MouseEvent) => void;
  onSaveTitle: (e: React.MouseEvent) => void;
  onStartEditing: (e: React.MouseEvent) => void;
  onDelete: (e: React.MouseEvent) => void;
}

const StoryCardActions: React.FC<StoryCardActionsProps> = ({
  isEditing,
  isFavorite,
  onToggleFavorite,
  onSaveTitle,
  onStartEditing,
  onDelete,
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
      {isEditing ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-primary hover:text-primary/90 bg-white/80 hover:bg-white/90"
          onClick={onSaveTitle}
        >
          <Check className="h-4 w-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-secondary hover:text-secondary/90 bg-white/80 hover:bg-white/90"
          onClick={onStartEditing}
        >
          <Edit2 className="h-4 w-4" />
        </Button>
      )}
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