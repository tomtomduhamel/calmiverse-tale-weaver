
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

  // Méthode simplifiée pour gérer les clics sur les cartes
  const handleCardClick = (story: Story) => {
    console.log("[StoryGrid] DEBUG: Clic sur histoire:", story.id, "status:", story.status);
    
    // Nous passons simplement l'histoire au gestionnaire de niveau supérieur
    if (onCardClick) {
      console.log("[StoryGrid] DEBUG: Propagation du clic vers le composant parent");
      onCardClick(story);
    } else {
      console.log("[StoryGrid] DEBUG: Aucun gestionnaire onCardClick fourni");
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
