
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
    console.log("[StoryGrid] Carte cliquée pour histoire:", story.id, "status:", story.status);
    
    // Nous simplifions la logique - toujours propager le clic s'il y a un gestionnaire
    if (onCardClick) {
      console.log("[StoryGrid] Propagation du clic au niveau supérieur");
      onCardClick(story);
    } else {
      console.log("[StoryGrid] Gestionnaire de clic non fourni");
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
