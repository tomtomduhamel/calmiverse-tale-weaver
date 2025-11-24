import React, { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "../ui/card";
import { FavoriteButton } from "../story/FavoriteButton";
import { CreateSequelButton } from "../story/series/CreateSequelButton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Loader2, BookCheck, Sparkles, Trash2 } from "lucide-react";
import { getStoryImageUrl } from "@/utils/supabaseImageUtils";

interface MobileStoryCardProps {
  story: Story;
  onClick?: () => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onDelete?: (storyId: string) => void;
  onSequelCreated?: (storyId: string) => void;
  isUpdatingFavorite?: boolean;
  isDeleting?: boolean;
}

const MobileStoryCard: React.FC<MobileStoryCardProps> = ({
  story,
  onClick,
  onToggleFavorite,
  onDelete,
  onSequelCreated,
  isUpdatingFavorite = false,
  isDeleting = false,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
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
    
    // Empêcher l'ouverture de l'histoire si on clique sur le bouton "Créer une suite"
    if ((e.target as HTMLElement).closest('[data-sequel-button]')) {
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

  const handleFavoriteToggle = () => {
    if (onToggleFavorite) {
      onToggleFavorite(story.id, story.isFavorite || false);
    }
  };

  // Gestion du swipe pour la suppression
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDeleting) return;
    
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = startX.current;
    currentY.current = startY.current;
    // Ne pas activer isDragging immédiatement, attendre de détecter la direction
  }, [isDeleting]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDeleting) return;
    
    currentX.current = e.touches[0].clientX;
    currentY.current = e.touches[0].clientY;
    
    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;
    
    // Détecter la direction dominante du mouvement
    const isVerticalMovement = Math.abs(deltaY) > Math.abs(deltaX);
    
    // Si le mouvement est vertical, laisser le scroll natif fonctionner
    if (isVerticalMovement) {
      // Reset le swipe si on détecte un scroll vertical
      if (isDragging) {
        setIsDragging(false);
        setTranslateX(0);
      }
      return; // Ne rien faire, laisser le scroll natif
    }
    
    // Seulement activer le swipe si mouvement horizontal détecté avec un seuil minimal
    if (!isDragging && Math.abs(deltaX) > 10) {
      setIsDragging(true);
    }
    
    // Si c'est un swipe horizontal confirmé, gérer le swipe
    if (isDragging && deltaX < 0) {
      e.preventDefault(); // Bloquer le scroll SEULEMENT pour le swipe horizontal
      setTranslateX(Math.max(deltaX, -80)); // Limiter le swipe à 80px
    }
  }, [isDragging, isDeleting]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // Si le swipe dépasse 40px, maintenir la position de suppression
    if (translateX < -40) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  }, [isDragging, translateX]);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && !isDeleting) {
      onDelete(story.id);
    }
  }, [onDelete, story.id, isDeleting]);

  const resetSwipe = useCallback(() => {
    setTranslateX(0);
  }, []);

  const storyImageUrl = getStoryImageUrl(story.image_path);
  const timeAgo = formatDistanceToNow(story.createdAt, { addSuffix: true, locale: fr });

  return (
    <div className="relative overflow-hidden rounded-lg">
      {/* Bouton de suppression en arrière-plan */}
      <div className="absolute right-0 top-0 h-full w-20 bg-red-500 rounded-r-lg flex items-center justify-center">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-3 text-white disabled:opacity-50"
          aria-label="Supprimer l'histoire"
        >
          {isDeleting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Trash2 className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Carte principale */}
      <Card 
        ref={cardRef}
        className={`
          cursor-pointer border-l-4 ${getStatusColor()} bg-background
          ${story.isFavorite ? 'ring-1 ring-amber-200' : ''}
          ${isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'}
          ${!isDragging && translateX === 0 ? 'hover:shadow-md active:scale-[0.98]' : ''}
        `}
        style={{
          transform: `translateX(${translateX}px)`
        }}
        onClick={translateX < -10 ? resetSwipe : handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              <div data-favorite-button className="flex-shrink-0">
                <FavoriteButton
                  isFavorite={story.isFavorite || false}
                  onToggle={handleFavoriteToggle}
                  isLoading={isUpdatingFavorite}
                  size="sm"
                  variant="ghost"
                />
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
            
            {/* Bouton créer une suite si disponible */}
            {((story.status === 'ready' || story.status === 'read' || story.status === 'completed') && !story.next_story_id && onSequelCreated) && (
              <div className="mb-2" data-sequel-button>
                <CreateSequelButton 
                  story={story}
                  onSequelCreated={onSequelCreated}
                  disabled={isDeleting}
                  variant="ghost"
                  size="sm"
                />
              </div>
            )}
            
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
    </div>
  );
};

export default React.memo(MobileStoryCard);