
import React, { useCallback } from "react";
import StoryLibrary from "@/components/StoryLibrary";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import { BackgroundGenerationIndicator } from "@/components/stories/BackgroundGenerationIndicator";

interface LibraryViewProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory: (storyId: string) => void;
  onRetryStory?: (storyId: string) => Promise<boolean>;
  isRetrying?: boolean;
  pendingStoryId?: string | null;
}

/**
 * PHASE 2: LibraryView simplifié - plus de onViewChange
 * La navigation est gérée par les composants enfants via useAppNavigation
 */
export const LibraryView: React.FC<LibraryViewProps> = React.memo(({
  stories,
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  isRetrying,
  pendingStoryId
}) => {
  // Transmission directe sans logique conditionnelle
  const handleSelectStory = useCallback((story: Story) => {
    console.log("[LibraryView] DEBUG: Transmission directe de la sélection d'histoire:", story.id);
    // Transmission immédiate au parent
    onSelectStory(story);
  }, [onSelectStory]);
  
  return (
    <div className="animate-fade-in space-y-4">
      <BackgroundGenerationIndicator />
      <StoryLibrary
        stories={stories}
        onSelectStory={handleSelectStory}
        onDeleteStory={onDeleteStory}
        onRetryStory={onRetryStory}
        isRetrying={isRetrying}
        pendingStoryId={pendingStoryId}
      />
    </div>
  );
});

LibraryView.displayName = "LibraryView";
