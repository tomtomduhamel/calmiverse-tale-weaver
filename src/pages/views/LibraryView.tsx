
import React from "react";
import StoryLibrary from "@/components/StoryLibrary";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";

interface LibraryViewProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory: (storyId: string) => void;
  onViewChange: (view: ViewType) => void;
  pendingStoryId?: string | null;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  stories,
  onSelectStory,
  onDeleteStory,
  onViewChange,
  pendingStoryId
}) => {
  return (
    <div className="animate-fade-in">
      <StoryLibrary
        stories={stories}
        onSelectStory={onSelectStory}
        onDeleteStory={onDeleteStory}
        onViewChange={onViewChange}
        pendingStoryId={pendingStoryId}
      />
    </div>
  );
};
