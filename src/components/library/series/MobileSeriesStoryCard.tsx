import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, CheckCircle, Clock, AlertTriangle, BookCheck, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { getStoryImageUrl } from '@/utils/supabaseImageUtils';
import type { Story } from '@/types/story';

interface MobileSeriesStoryCardProps {
  story: Story;
  index: number;
  readStoriesCount: number;
  onClick: () => void;
  onDelete?: (storyId: string) => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onRetry?: (storyId: string) => void;
  isDeleting?: boolean;
  isUpdatingFavorite?: boolean;
  isRetrying?: boolean;
}

export const MobileSeriesStoryCard: React.FC<MobileSeriesStoryCardProps> = ({
  story,
  index,
  readStoriesCount,
  onClick,
  onDelete,
  isDeleting = false,
}) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);
  const detectedDirection = useRef<'none' | 'vertical' | 'horizontal'>('none');
  const cardRef = useRef<HTMLDivElement>(null);
  
  const DETECTION_THRESHOLD = 5;

  const isNextRecommended = index === readStoriesCount && story.status !== 'read';

  // Reset le swipe quand la suppression démarre
  useEffect(() => {
    if (isDeleting) {
      setTranslateX(0);
    }
  }, [isDeleting]);

  // Gestion du swipe pour la suppression
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isDeleting) return;
    
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    currentX.current = startX.current;
    currentY.current = startY.current;
    detectedDirection.current = 'none';
  }, [isDeleting]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (isDeleting) return;
    
    if (detectedDirection.current === 'vertical') return;
    
    currentX.current = e.touches[0].clientX;
    currentY.current = e.touches[0].clientY;
    
    const deltaX = currentX.current - startX.current;
    const deltaY = currentY.current - startY.current;
    
    if (detectedDirection.current === 'none') {
      if (Math.abs(deltaX) < DETECTION_THRESHOLD && Math.abs(deltaY) < DETECTION_THRESHOLD) {
        return;
      }
      
      const isVerticalMovement = Math.abs(deltaY) > Math.abs(deltaX);
      
      if (isVerticalMovement) {
        detectedDirection.current = 'vertical';
        return;
      }
      
      detectedDirection.current = 'horizontal';
      setIsDragging(true);
    }
    
    if (detectedDirection.current === 'horizontal' && deltaX < 0) {
      e.preventDefault();
      setTranslateX(Math.max(deltaX, -80));
    }
  }, [isDeleting]);

  const handleTouchEnd = useCallback(() => {
    if (detectedDirection.current !== 'horizontal') {
      setIsDragging(false);
      return;
    }
    
    setIsDragging(false);
    
    const deltaX = currentX.current - startX.current;
    if (deltaX < -40) {
      setTranslateX(-80);
    } else {
      setTranslateX(0);
    }
  }, []);

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete && !isDeleting) {
      onDelete(story.id);
    }
  }, [onDelete, story.id, isDeleting]);

  const resetSwipe = useCallback(() => {
    setTranslateX(0);
  }, []);

  const handleCardClick = () => {
    if (translateX < -10) {
      resetSwipe();
    } else {
      onClick();
    }
  };

  return (
    <div className="relative overflow-hidden rounded-lg" style={{ touchAction: 'manipulation' }}>
      {/* Bouton de suppression en arrière-plan */}
      <div className="absolute right-0 top-0 h-full w-20 bg-destructive rounded-r-lg flex items-center justify-center">
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-3 text-destructive-foreground disabled:opacity-50"
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
          cursor-pointer transition-all duration-200 
          bg-card dark:bg-slate-900 border
          ${isNextRecommended ? 'ring-1 ring-primary/30' : 'hover:shadow-sm hover:border-primary/20'}
          ${isDragging ? 'transition-none' : 'transition-transform duration-300 ease-out'}
        `}
        style={{
          transform: `translateX(${translateX}px)`
        }}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <CardContent className="p-3">
          <div className="flex gap-2.5">
            {/* Image compacte */}
            {story.image_path ? (
              <div className="w-9 h-12 rounded-sm overflow-hidden bg-muted flex-shrink-0">
                <img 
                  src={getStoryImageUrl(story.image_path) || ''} 
                  alt={story.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-9 h-12 rounded-sm bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-3 h-3 text-primary/60" />
              </div>
            )}
            
            <div className="flex-1 min-w-0 space-y-1">
              {/* Header avec tome et statut */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {story.tome_number && (
                    <Badge variant="outline" className="text-xs px-1.5 py-0 h-5">
                      Tome {story.tome_number}
                    </Badge>
                  )}
                  {story.status === 'completed' && <CheckCircle className="w-3 h-3 text-green-500" />}
                  {story.status === 'pending' && <Clock className="w-3 h-3 text-yellow-500" />}
                  {story.status === 'error' && <AlertTriangle className="w-3 h-3 text-destructive" />}
                </div>
                
                {/* Indicateur de lecture recommandée */}
                {isNextRecommended && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 px-1.5 py-0 h-5">
                    À lire
                  </Badge>
                )}
              </div>
              
              {/* Titre compact */}
              <h4 className="font-medium text-sm text-foreground line-clamp-2 leading-tight">
                {story.title}
              </h4>
              
              {/* Métadonnées compactes */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {story.status === 'read' && (
                  <div className="flex items-center text-green-600">
                    <BookCheck className="h-3 w-3 mr-1" />
                    <span className="font-medium">Lu</span>
                  </div>
                )}
                {story.status === 'completed' && (
                  <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200 px-1.5 py-0 h-4 text-xs">
                    Prête
                  </Badge>
                )}
                {story.status === 'pending' && (
                  <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-yellow-200 px-1.5 py-0 h-4 text-xs">
                    En cours
                  </Badge>
                )}
                {story.status === 'error' && (
                  <Badge variant="destructive" className="px-1.5 py-0 h-4 text-xs">
                    Erreur
                  </Badge>
                )}
                <span className="ml-auto">
                  {formatDistanceToNow(story.createdAt, { addSuffix: true, locale: fr })}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default React.memo(MobileSeriesStoryCard);
