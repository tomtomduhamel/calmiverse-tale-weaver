
import React from "react";
import type { Story } from "@/types/story";
import StoryCard from "./StoryCard";

interface StoryGridProps {
  stories: Story[];
  onDelete?: (e: React.MouseEvent, storyId: string) => void;
  onRetry?: (e: React.MouseEvent, storyId: string) => void;
  onCardClick?: (story: Story) => void;
  isRetrying?: boolean;
  isDeletingId?: string | null;
  pendingStoryId?: string | null;
}

const StoryGrid: React.FC<StoryGridProps> = ({
  stories,
  onDelete,
  onRetry,
  onCardClick,
  isRetrying,
  isDeletingId,
  pendingStoryId
}) => {
  if (stories.length === 0) {
    return (
      <div className="text-center py-10 border border-dashed rounded-lg">
        <p className="text-muted-foreground">Aucune histoire trouvée</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          onDelete={onDelete}
          onRetry={onRetry}
          onClick={onCardClick ? () => onCardClick(story) : undefined}
          isRetrying={isRetrying && pendingStoryId === story.id}
          isDeleting={isDeletingId === story.id}
          isPending={pendingStoryId === story.id}
        />
      ))}
    </div>
  );
};

export default StoryGrid;
