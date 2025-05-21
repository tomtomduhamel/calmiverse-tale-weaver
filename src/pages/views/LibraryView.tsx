
import React, { useCallback } from "react";
import StoryLibrary from "@/components/StoryLibrary";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";

interface LibraryViewProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory: (storyId: string) => void;
  onViewChange: (view: ViewType) => void;
  onRetryStory?: (storyId: string) => void;
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
  const handleSelectStory = useCallback((story: Story) => {
    console.log("LibraryView: Story selected:", story.id);
    onSelectStory(story);
  }, [onSelectStory]);
  
  return (
    <div className="animate-fade-in">
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
