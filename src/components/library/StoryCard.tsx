
import React from "react";
import { Card, CardContent, CardFooter } from "../ui/card";
import StoryCardTitle from "./card/StoryCardTitle";
import StoryCardActions from "./card/StoryCardActions";
import StoryCardTags from "./card/StoryCardTags";
import { FavoriteButton } from "../story/FavoriteButton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Loader2, BookCheck, Sparkles } from "lucide-react";

interface StoryCardProps {
  story: Story;
  onClick?: () => void;
  onDelete?: () => void;
  onRetry?: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  isRetrying?: boolean;
  isDeleting?: boolean;
  isPending?: boolean;
  isUpdatingFavorite?: boolean;
}

const StoryCard: React.FC<StoryCardProps> = ({
  story,
  onClick,
  onDelete,
  onRetry,
  onToggleFavorite,
  isRetrying = false,
  isDeleting = false,
  isPending = false,
  isUpdatingFavorite = false,
}) => {
  // Toutes les histoires sont maintenant cliquables
  const isClickable = true;
  
  // Vérifier si l'histoire est récente (dernières 24h)
  const isRecentStory = (): boolean => {
    const now = new Date();
    const storyDate = new Date(story.createdAt);
    const hoursDiff = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const isRecent = isRecentStory();
  
  const cardStyles = [
    "transition-all duration-300 hover:shadow-md relative",
    isClickable ? "cursor-pointer hover:translate-y-[-2px] hover:scale-[1.01] bg-green-50/30 border-green-300" : "",
    story.status === "error" ? "border-red-200 bg-red-50" : "",
    story.status === "pending" || isPending ? "border-amber-200 bg-amber-50" : "",
    story.status === "read" ? "border-green-200 bg-green-50" : "",
    story.isFavorite && story.status !== "error" && story.status !== "read" ? "border-amber-200" : "",
    story.isFavorite && story.status === "read" ? "border-green-200" : "",
    isRecent ? "border-blue-300 bg-blue-50/50" : "", // Style pour les histoires récentes
  ].join(" ");

  const getTimeAgo = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: fr });
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Empêcher la propagation si le clic provient du bouton favori
    if ((e.target as HTMLElement).closest('[data-favorite-button]')) {
      return;
    }
    
    console.log("[StoryCard] DEBUG: Clic sur carte:", story.id, "status:", story.status);
    
    if (onClick) {
      console.log("[StoryCard] DEBUG: Appel du gestionnaire onClick sans conditions");
      document.body.style.cursor = "wait";
      
      setTimeout(() => {
        onClick();
        document.body.style.cursor = "default";
      }, 100);
    } else {
      console.log("[StoryCard] DEBUG: Aucun gestionnaire onClick fourni");
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation(); // Empêcher l'ouverture de l'histoire
    if (onToggleFavorite) {
      onToggleFavorite(story.id, story.isFavorite || false);
    }
  };

  return (
    <Card className={cardStyles} onClick={handleCardClick}>
      <CardContent className="pt-6 pb-2">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2 flex-1">
            <StoryCardTitle title={story.title} status={story.status} isFavorite={story.isFavorite} />
            {isRecent && (
              <div className="flex items-center text-blue-600 text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                <span className="font-medium">Nouveau</span>
              </div>
            )}
          </div>
          
          {/* Bouton favoris */}
          <div data-favorite-button onClick={handleToggleFavorite}>
            <FavoriteButton
              isFavorite={story.isFavorite || false}
              onToggle={() => {}} // Le gestionnaire est dans le div parent
              isLoading={isUpdatingFavorite}
              size="sm"
              variant="ghost"
            />
          </div>
        </div>
        
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
            <span className={isRecent ? "text-blue-600 font-medium" : ""}>
              {getTimeAgo(story.createdAt)}
            </span>
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
