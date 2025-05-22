
import React from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import StoryCardTitle from "./card/StoryCardTitle";
import StoryCardActions from "./card/StoryCardActions";
import StoryCardTags from "./card/StoryCardTags";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Loader2, BookCheck } from "lucide-react";

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
  // Toutes les histoires sont maintenant cliquables
  const isClickable = true;
  
  const cardStyles = [
    "transition-all duration-300 hover:shadow-md relative",
    isClickable ? "cursor-pointer hover:translate-y-[-2px] hover:scale-[1.01] bg-green-50/30 border-green-300" : "",
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
    console.log("[StoryCard] DEBUG: Clic sur carte:", story.id, "status:", story.status);
    
    // Toujours appeler onClick si disponible
    if (onClick) {
      console.log("[StoryCard] DEBUG: Appel du gestionnaire onClick sans conditions");
      // Animation de clic
      document.body.style.cursor = "wait";
      
      // Après l'animation, appeler onClick
      setTimeout(() => {
        onClick();
        document.body.style.cursor = "default";
      }, 100);
    } else {
      console.log("[StoryCard] DEBUG: Aucun gestionnaire onClick fourni");
    }
  };

  return (
    <Card className={cardStyles} onClick={handleCardClick}>
      <CardContent className="pt-6 pb-2">
        <StoryCardTitle title={story.title} status={story.status} isFavorite={story.isFavorite} />
        
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
