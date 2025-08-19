import React from "react";
import { Card, CardContent } from "../ui/card";
import { FavoriteButton } from "../story/FavoriteButton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Loader2, BookCheck, Sparkles, Heart } from "lucide-react";
import { getStoryImageUrl } from "@/utils/supabaseImageUtils";

interface MobileStoryCardProps {
  story: Story;
  onClick?: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  isUpdatingFavorite?: boolean;
}

const MobileStoryCard: React.FC<MobileStoryCardProps> = ({
  story,
  onClick,
  onToggleFavorite,
  isUpdatingFavorite = false,
}) => {
  const isRecentStory = (): boolean => {
    const now = new Date();
    const storyDate = new Date(story.createdAt);
    const hoursDiff = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  const isRecent = isRecentStory();
  
  const getStatusColor = () => {
    switch (story.status) {
      case "error": return "border-l-red-500 bg-red-50/50";
      case "pending": return "border-l-amber-500 bg-amber-50/50";
      case "read": return "border-l-green-500 bg-green-50/50";
      default: return isRecent ? "border-l-blue-500 bg-blue-50/50" : "border-l-gray-300";
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-favorite-button]')) {
      return;
    }
    
    if (onClick) {
      onClick();
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(story.id, story.isFavorite || false);
    }
  };

  const storyImageUrl = getStoryImageUrl(story.image_path);
  const timeAgo = formatDistanceToNow(story.createdAt, { addSuffix: true, locale: fr });

  return (
    <Card 
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98]
        border-l-4 ${getStatusColor()}
        ${story.isFavorite ? 'ring-1 ring-amber-200' : ''}
      `}
      onClick={handleCardClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          {/* Image de couverture compacte */}
          {storyImageUrl && (
            <div className="flex-shrink-0">
              <img 
                src={storyImageUrl} 
                alt=""
                className="w-12 h-12 object-cover rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}
          
          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-1">
              <h3 className="font-medium text-sm leading-tight line-clamp-2 pr-2">
                {story.title}
              </h3>
              
              {/* Bouton favoris compact */}
              <div data-favorite-button onClick={handleToggleFavorite} className="flex-shrink-0">
                {story.isFavorite ? (
                  <Heart className="h-4 w-4 text-amber-500 fill-current" />
                ) : (
                  <FavoriteButton
                    isFavorite={false}
                    onToggle={() => {}}
                    isLoading={isUpdatingFavorite}
                    size="sm"
                    variant="ghost"
                  />
                )}
              </div>
            </div>
            
            {/* Statut et badges */}
            <div className="flex items-center gap-2 mb-2">
              {story.status === "pending" && (
                <div className="flex items-center text-amber-600 text-xs">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  <span>En cours...</span>
                </div>
              )}
              
              {story.status === "read" && (
                <div className="flex items-center text-green-600 text-xs">
                  <BookCheck className="h-3 w-3 mr-1" />
                  <span>Lu</span>
                </div>
              )}
              
              {isRecent && story.status !== "read" && (
                <div className="flex items-center text-blue-600 text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  <span className="font-medium">Nouveau</span>
                </div>
              )}
            </div>
            
            {/* Métadonnées compactes */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={isRecent ? "text-blue-600 font-medium" : ""}>
                {timeAgo}
              </span>
              
              {story.status === "error" && (
                <span className="text-red-500 font-medium">Erreur</span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(MobileStoryCard);