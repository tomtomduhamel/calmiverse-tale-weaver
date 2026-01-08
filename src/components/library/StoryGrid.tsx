
import React, { useState } from "react";
import type { Story, LibraryItem } from "@/types/story";
import StoryCard from "./StoryCard";
import MobileStoryCard from "./MobileStoryCard";
import { SeriesCard } from "./series/SeriesCard";
import { SeriesStoriesModal } from "./series/SeriesStoriesModal";
import { useIsMobile } from "@/hooks/use-mobile";

interface StoryGridProps {
  items: LibraryItem[];
  onDelete?: (storyId: string) => void;
  onRetry?: (storyId: string) => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  onSequelCreated?: (storyId: string) => void;
  onCardClick?: (story: Story) => void;
  isRetrying?: boolean;
  isDeletingId?: string | null;
  isUpdatingFavorite?: boolean;
  isUpdatingReadStatus?: boolean;
  pendingStoryId?: string | null;
}

const StoryGrid: React.FC<StoryGridProps> = ({
  items,
  onDelete,
  onRetry,
  onToggleFavorite,
  onMarkAsRead,
  onSequelCreated,
  onCardClick,
  isRetrying,
  isDeletingId,
  isUpdatingFavorite,
  isUpdatingReadStatus,
  pendingStoryId
}) => {
  const isMobile = useIsMobile();
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  // Récupérer la série sélectionnée depuis les items mis à jour
  const selectedSeries = selectedSeriesId 
    ? items.find(item => item.type === 'series' && item.id === selectedSeriesId) || null
    : null;

  if (items.length === 0) {
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
    <>
      <div className={
        isMobile 
          ? "space-y-2 px-2" 
          : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
      }>
        {items.map((item) => {
          if (item.type === 'series') {
            return isMobile ? (
              // Version mobile pour les séries - utilise une carte similaire
              <SeriesCard
                key={item.id}
                seriesGroup={item}
                onClick={() => setSelectedSeriesId(item.id)}
                className="mx-2"
              />
            ) : (
              <SeriesCard
                key={item.id}
                seriesGroup={item}
                onClick={() => setSelectedSeriesId(item.id)}
              />
            );
          } else {
            const story = item.story;
            return isMobile ? (
              <MobileStoryCard
                key={story.id}
                story={story}
                onClick={() => handleCardClick(story)}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDelete ? () => onDelete(story.id) : undefined}
                onSequelCreated={onSequelCreated}
                isUpdatingFavorite={isUpdatingFavorite}
                isDeleting={isDeletingId === story.id}
              />
            ) : (
              <StoryCard
                key={story.id}
                story={story}
                onDelete={onDelete ? () => onDelete(story.id) : undefined}
                onRetry={onRetry ? () => onRetry(story.id) : undefined}
                onToggleFavorite={onToggleFavorite}
                onMarkAsRead={onMarkAsRead}
                onSequelCreated={onSequelCreated}
                onClick={() => handleCardClick(story)}
                isRetrying={isRetrying && pendingStoryId === story.id}
                isDeleting={isDeletingId === story.id}
                isUpdatingFavorite={isUpdatingFavorite}
                isUpdatingReadStatus={isUpdatingReadStatus}
                isPending={pendingStoryId === story.id}
              />
            );
          }
        })}
      </div>

      {/* Modal pour sélectionner une histoire dans une série */}
      {selectedSeries && selectedSeries.type === 'series' && (
        <SeriesStoriesModal
          isOpen={!!selectedSeries}
          onClose={() => setSelectedSeriesId(null)}
          seriesGroup={selectedSeries}
          onSelectStory={handleCardClick}
          onToggleFavorite={onToggleFavorite}
          onDeleteStory={onDelete}
          onRetryStory={onRetry}
          isUpdatingFavorite={isUpdatingFavorite}
          isDeletingId={isDeletingId}
          isRetrying={isRetrying}
          pendingStoryId={pendingStoryId}
        />
      )}
    </>
  );
};

export default StoryGrid;
