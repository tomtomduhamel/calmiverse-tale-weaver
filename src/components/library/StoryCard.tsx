
import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import StoryCardTitle from "./card/StoryCardTitle";
import StoryCardTags from "./card/StoryCardTags";
import StoryCardActions from "./card/StoryCardActions";
import type { Story } from "@/types/story";

interface StoryCardProps {
  story: Story;
  onDelete: (e: React.MouseEvent) => void;
  onRetry?: (e: React.MouseEvent) => void;
  onClick: () => void;
  isRetrying?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({ 
  story, 
  onDelete, 
  onRetry, 
  onClick, 
  isRetrying = false
}) => {
  return (
    <Card
      className={`h-full flex flex-col justify-between rounded-xl shadow-soft transition-all duration-300 hover:shadow-lg cursor-pointer overflow-hidden border-2 ${
        story.status === 'error' ? 'border-red-200' : story.isFavorite ? 'border-amber-200' : 'border-transparent'
      } ${story.status === 'pending' ? 'bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <CardHeader className="p-3 pb-1">
        <StoryCardTitle
          title={story.title}
          isFavorite={story.isFavorite}
          status={story.status}
        />
        <StoryCardTags
          tags={story.tags || []}
          objective={story.objective}
          status={story.status}
          error={story.error}
        />
      </CardHeader>
      <CardContent className="p-3 pb-4 flex flex-col justify-between flex-grow">
        <div>
          <p className="text-sm mb-4 text-gray-700 dark:text-gray-300 line-clamp-3">
            {story.preview}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {story.childrenNames?.join(", ")}
          </p>
        </div>
        <StoryCardActions
          storyId={story.id}
          onDelete={onDelete}
          onRetry={onRetry}
          status={story.status}
          isRetrying={isRetrying}
        />
      </CardContent>
    </Card>
  );
};

export default StoryCard;
