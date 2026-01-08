/**
 * Instagram-style Feed Card Component
 * Features: 1:1 image ratio, double-tap favorite, lazy loading
 */

import React, { useState, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/story/FavoriteButton";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import type { Story } from "@/types/story";
import { Clock, Share2, BookPlus, Loader2, Heart } from "lucide-react";
import { getStoryImageUrl } from "@/utils/supabaseImageUtils";
import { calculateReadingTime } from "@/utils/readingTime";
import { cn } from "@/lib/utils";

interface FeedCardProps {
  story: Story;
  onClick: () => void;
  onToggleFavorite: (storyId: string, currentStatus: boolean) => void;
  onShare?: (storyId: string) => void;
  onCreateSequel?: (storyId: string) => void;
  isUpdatingFavorite?: boolean;
}

const FeedCard: React.FC<FeedCardProps> = ({
  story,
  onClick,
  onToggleFavorite,
  onShare,
  onCreateSequel,
  isUpdatingFavorite = false,
}) => {
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const lastTapRef = useRef<number>(0);
  const imageRef = useRef<HTMLDivElement>(null);

  const storyImageUrl = getStoryImageUrl(story.image_path);
  const readingTime = calculateReadingTime(story.content);
  const timeAgo = formatDistanceToNow(story.createdAt, { addSuffix: false, locale: fr });

  // Handle double tap for favorite
  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!story.isFavorite) {
        onToggleFavorite(story.id, false);
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 1000);
      }
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      // Single tap after delay - navigate
      setTimeout(() => {
        if (lastTapRef.current !== 0 && Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
          onClick();
          lastTapRef.current = 0;
        }
      }, DOUBLE_TAP_DELAY);
    }
  }, [story.id, story.isFavorite, onToggleFavorite, onClick]);

  const handleToggleFavorite = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    onToggleFavorite(story.id, story.isFavorite || false);
  }, [story.id, story.isFavorite, onToggleFavorite]);

  const canCreateSequel = (story.status === 'ready' || story.status === 'read' || story.status === 'completed') 
    && !story.next_story_id;

  return (
    <Card className="overflow-hidden border-0 shadow-none bg-transparent">
      {/* Header: Title + Favorite */}
      <div className="flex items-center justify-between px-1 py-3">
        <h3 
          className="font-semibold text-base leading-tight line-clamp-1 flex-1 cursor-pointer hover:text-primary transition-colors"
          onClick={onClick}
        >
          {story.title}
        </h3>
        <div data-favorite-button>
          <FavoriteButton
            isFavorite={story.isFavorite || false}
            onToggle={handleToggleFavorite}
            isLoading={isUpdatingFavorite}
            size="sm"
            variant="ghost"
          />
        </div>
      </div>

      {/* Image container: 1:1 ratio with double-tap */}
      <div 
        ref={imageRef}
        className="relative aspect-square w-full overflow-hidden rounded-lg cursor-pointer bg-muted"
        onClick={handleDoubleTap}
      >
        {storyImageUrl ? (
          <img
            src={storyImageUrl}
            alt={story.title}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
            <span className="text-6xl opacity-50">📖</span>
          </div>
        )}

        {/* Pending overlay */}
        {story.status === 'pending' && (
          <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium">En cours de création...</span>
            </div>
          </div>
        )}

        {/* Heart animation on double-tap */}
        {showHeartAnimation && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart 
              className="h-24 w-24 text-red-500 fill-red-500 animate-ping" 
            />
          </div>
        )}
      </div>

      {/* Metadata: Reading time + Date */}
      <CardContent className="px-1 pt-3 pb-0">
        <div className="flex items-center gap-3 text-sm text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {readingTime}
          </span>
          <span className="text-xs">•</span>
          <span>Il y a {timeAgo}</span>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 pb-4 border-b border-border">
          {onShare && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(story.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Share2 className="h-4 w-4 mr-1.5" />
              Partager
            </Button>
          )}
          {onCreateSequel && canCreateSequel && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCreateSequel(story.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              <BookPlus className="h-4 w-4 mr-1.5" />
              Créer une suite
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default React.memo(FeedCard);
