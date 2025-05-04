
import React from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import StoryCardTitle from "./card/StoryCardTitle";
import StoryCardActions from "./card/StoryCardActions";
import StoryCardTags from "./card/StoryCardTags";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Loader2 } from "lucide-react";

interface StoryCardProps {
  story: Story;
  onClick?: () => void;
  onDelete?: (e: React.MouseEvent) => void;
  onRetry?: (e: React.MouseEvent) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
  isPending?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onClick,
  onDelete,
  onRetry,
  isRetrying = false,
  isDeleting = false,
  isPending = false,
}) => {
  const cardStyles = [
    "transition-all duration-300 hover:shadow-md",
    onClick ? "cursor-pointer" : "",
    story.status === "error" ? "border-red-200 bg-red-50" : "",
    story.status === "pending" || isPending ? "border-amber-200 bg-amber-50" : "",
    story.isFavorite && story.status !== "error" ? "border-amber-200" : "",
  ].join(" ");

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  // Create handler functions that won't mutate during render
  const handleClick = onClick ? () => onClick() : undefined;
  
  const handleDelete = onDelete ? (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(e);
  } : undefined;
  
  const handleRetry = onRetry ? (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry(e);
  } : undefined;

  return (
    <Card className={cardStyles} onClick={handleClick}>
      <CardContent className="pt-6 pb-2">
        <StoryCardTitle title={story.title} status={story.status} isFavorite={story.isFavorite} />
        <p className="text-sm text-gray-600 line-clamp-3 mb-3 h-[4.5rem]">
          {story.preview}
        </p>
        <StoryCardTags 
          status={story.status} 
          objective={story.objective}
          tags={story.tags}
          error={story.error}
        />
      </CardContent>
      <CardFooter className="flex justify-between pt-2 pb-4">
        <span className="text-xs text-gray-500">
          {story.status === "pending" || isPending ? (
            <span className="flex items-center">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              En génération...
            </span>
          ) : (
            getTimeAgo(story.createdAt)
          )}
        </span>
        <StoryCardActions 
          story={story} 
          onDelete={handleDelete}
          onRetry={handleRetry}
          isRetrying={isRetrying}
          isDeleting={isDeleting}
        />
      </CardFooter>
    </Card>
  );
};

export default StoryCard;
