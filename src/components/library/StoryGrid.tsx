
import React from "react";
import type { Story } from "@/types/story";
import StoryCard from "./StoryCard";
import MobileStoryCard from "./MobileStoryCard";
import { useIsMobile } from "@/hooks/use-mobile";

interface StoryGridProps {
  stories: Story[];
  onDelete?: (storyId: string) => void;
  onRetry?: (storyId: string) => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  onCardClick?: (story: Story) => void;
  isRetrying?: boolean;
  isDeletingId?: string | null;
  isUpdatingFavorite?: boolean;
  isUpdatingReadStatus?: boolean;
  pendingStoryId?: string | null;
}

const StoryGrid: React.FC<StoryGridProps> = ({
  stories,
  onDelete,
  onRetry,
  onToggleFavorite,
  onMarkAsRead,
  onCardClick,
  isRetrying,
  isDeletingId,
  isUpdatingFavorite,
  isUpdatingReadStatus,
  pendingStoryId
}) => {
  const isMobile = useIsMobile();
  if (stories.length === 0) {
    return (
      <div className="text-center py-8 sm:py-10 border border-dashed rounded-lg mx-2 sm:mx-0">
        <p className="text-muted-foreground text-sm sm:text-base">Aucune histoire trouvée</p>
      </div>
    );
  }

  // Méthode directe pour transmettre le clic d'histoire
  const handleCardClick = (story: Story) => {
    console.log("[StoryGrid] DEBUG: Transmission directe du clic sur histoire:", story.id);
    if (onCardClick) {
      console.log("[StoryGrid] DEBUG: Appel direct de onCardClick sans vérification de statut");
      onCardClick(story);
    }
  };

  return (
    <div className={
      isMobile 
        ? "space-y-2 px-2" 
        : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
    }>
      {stories.map((story) => (
        isMobile ? (
          <MobileStoryCard
            key={story.id}
            story={story}
            onClick={() => handleCardClick(story)}
            onToggleFavorite={onToggleFavorite}
            isUpdatingFavorite={isUpdatingFavorite}
          />
        ) : (
          <StoryCard
            key={story.id}
            story={story}
            onDelete={onDelete ? () => onDelete(story.id) : undefined}
            onRetry={onRetry ? () => onRetry(story.id) : undefined}
            onToggleFavorite={onToggleFavorite}
            onMarkAsRead={onMarkAsRead}
            onClick={() => handleCardClick(story)}
            isRetrying={isRetrying && pendingStoryId === story.id}
            isDeleting={isDeletingId === story.id}
            isUpdatingFavorite={isUpdatingFavorite}
            isUpdatingReadStatus={isUpdatingReadStatus}
            isPending={pendingStoryId === story.id}
          />
        )
      ))}
    </div>
  );
};

export default StoryGrid;
