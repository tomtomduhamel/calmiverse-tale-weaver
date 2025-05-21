
import React from "react";
import type { Story } from "@/types/story";
import StoryCard from "./StoryCard";

interface StoryGridProps {
  stories: Story[];
  onDelete?: (storyId: string) => void;
  onRetry?: (storyId: string) => void;
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

  const handleCardClick = (story: Story) => {
    console.log("StoryGrid: Card clicked for story:", story.id, "with status:", story.status);
    if (onCardClick) {
      onCardClick(story);
    } else {
      console.warn("StoryGrid: No onCardClick handler provided");
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          onDelete={onDelete ? () => onDelete(story.id) : undefined}
          onRetry={onRetry ? () => onRetry(story.id) : undefined}
          onClick={() => handleCardClick(story)}
          isRetrying={isRetrying && pendingStoryId === story.id}
          isDeleting={isDeletingId === story.id}
          isPending={pendingStoryId === story.id}
        />
      ))}
    </div>
  );
};

export default StoryGrid;
