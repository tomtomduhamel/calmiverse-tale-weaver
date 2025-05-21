
import React from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import StoryCardTitle from "./card/StoryCardTitle";
import StoryCardActions from "./card/StoryCardActions";
import StoryCardTags from "./card/StoryCardTags";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Loader2, BookCheck, BookOpenCheck } from "lucide-react";

interface StoryCardProps {
  story: Story;
  onClick?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
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
  // Une histoire est cliquable uniquement si elle est prête ou déjà lue
  const isClickable = story.status === "ready" || story.status === "read";
  
  const cardStyles = [
    "transition-all duration-300 hover:shadow-md relative",
    isClickable ? "cursor-pointer hover:translate-y-[-2px] hover:scale-[1.01] bg-green-50/30" : "",
    story.status === "error" ? "border-red-200 bg-red-50" : "",
    story.status === "pending" || isPending ? "border-amber-200 bg-amber-50" : "",
    story.status === "read" ? "border-green-200 bg-green-50" : "",
    story.isFavorite && story.status !== "error" && story.status !== "read" ? "border-amber-200" : "",
    story.isFavorite && story.status === "read" ? "border-green-200" : "",
  ].join(" ");

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  const handleCardClick = () => {
    console.log("[StoryCard] Clic sur carte:", story.id, "status:", story.status, "isClickable:", isClickable);
    
    // Action uniquement si l'histoire est cliquable et qu'un gestionnaire de clic existe
    if (isClickable && onClick) {
      console.log("[StoryCard] Histoire cliquable, appel du gestionnaire onClick");
      onClick();
    } else if (!isClickable) {
      console.log("[StoryCard] Histoire non cliquable - clic ignoré");
    } else if (!onClick) {
      console.log("[StoryCard] Aucun gestionnaire onClick fourni");
    }
  };

  return (
    <Card className={cardStyles} onClick={handleCardClick}>
      {/* Indicateur visuel très visible si l'histoire est cliquable */}
      {isClickable && (
        <div className="absolute top-2 right-2 text-green-600 animate-pulse">
          <BookOpenCheck size={20} className="opacity-90" />
        </div>
      )}
      
      <CardContent className="pt-6 pb-2">
        <StoryCardTitle title={story.title} status={story.status} isFavorite={story.isFavorite} />
        <p className="text-sm text-gray-600 line-clamp-3 mb-3 h-[4.5rem]">
          {story.preview}
        </p>
        
        {story.status === "read" && (
          <div className="flex items-center text-green-600 text-xs mb-2">
            <BookCheck className="h-4 w-4 mr-1" />
            <span>Lu</span>
          </div>
        )}
        
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
          onDelete={onDelete}
          onRetry={onRetry}
          isRetrying={isRetrying}
          isDeleting={isDeleting}
        />
      </CardFooter>
    </Card>
  );
};

export default React.memo(StoryCard);
