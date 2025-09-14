
import React, { useCallback } from "react";
import StoryLibrary from "@/components/StoryLibrary";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import { BackgroundGenerationIndicator } from "@/components/stories/BackgroundGenerationIndicator";

interface LibraryViewProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory: (storyId: string) => void;
  onViewChange: (view: ViewType) => void;
  onRetryStory?: (storyId: string) => Promise<boolean>;
  isRetrying?: boolean;
  pendingStoryId?: string | null;
}

export const LibraryView: React.FC<LibraryViewProps> = React.memo(({
  stories,
  onSelectStory,
  onDeleteStory,
  onViewChange,
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
        onViewChange={onViewChange}
        isRetrying={isRetrying}
        pendingStoryId={pendingStoryId}
      />
    </div>
  );
});

LibraryView.displayName = "LibraryView";
