
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Story } from "@/types/story";
import StoryCard from "./StoryCard";

interface StoryGridProps {
  stories: Story[];
  onDelete: (e: React.MouseEvent, storyId: string) => void;
  onRetry?: (e: React.MouseEvent, storyId: string) => void;
  onCardClick: (story: Story) => void;
  isRetrying?: boolean;
  isDeletingId?: string | null;
}

const StoryGrid: React.FC<StoryGridProps> = ({ 
  stories, 
  onDelete, 
  onRetry, 
  onCardClick,
  isRetrying = false,
  isDeletingId = null
}) => {
  return (
    <ScrollArea className="h-[calc(100vh-300px)]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stories.map((story) => (
          <StoryCard
            key={story.id}
            story={story}
            onDelete={(e) => onDelete(e, story.id)}
            onRetry={onRetry ? (e) => onRetry(e, story.id) : undefined}
            onClick={() => {
              console.log("Card clicked, story:", story);
              onCardClick(story);
            }}
            isRetrying={isRetrying && story.status === 'error'}
            isDeleting={isDeletingId === story.id}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default StoryGrid;
