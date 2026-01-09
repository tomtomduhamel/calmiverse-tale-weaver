/**
 * Main Feed Container with Infinite Scroll
 * Uses IntersectionObserver for efficient scroll detection
 */

import React, { useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Story } from "@/types/story";
import FeedCard from "./FeedCard";
import FeedSkeleton from "./FeedSkeleton";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedContainerProps {
  stories: Story[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onToggleFavorite: (storyId: string, currentStatus: boolean) => void;
  onShare?: (storyId: string) => void;
  onCreateSequel?: (storyId: string) => void;
  onSeriesClick?: (story: Story) => void;
  isUpdatingFavorite?: boolean;
}

const FeedContainer: React.FC<FeedContainerProps> = ({
  stories,
  isLoading,
  isLoadingMore,
  hasMore,
  onLoadMore,
  onToggleFavorite,
  onShare,
  onCreateSequel,
  onSeriesClick,
  isUpdatingFavorite = false,
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Handle story click - navigate to reader
  const handleStoryClick = useCallback((story: Story) => {
    if (story.status === 'pending') {
      toast({
        title: "Histoire en cours de génération",
        description: "Veuillez patienter, l'histoire sera bientôt prête.",
      });
      return;
    }
    navigate(`/reader/${story.id}`);
  }, [navigate, toast]);

  // Setup IntersectionObserver for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          console.log('[FeedContainer] Loading more stories...');
          onLoadMore();
        }
      },
      { 
        threshold: 0.1,
        rootMargin: '200px' // Start loading before reaching the bottom
      }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoadingMore, isLoading, onLoadMore]);

  // Initial loading state
  if (isLoading) {
    return <FeedSkeleton count={3} />;
  }

  // Empty state
  if (stories.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-semibold mb-2">Aucune histoire</h3>
        <p className="text-muted-foreground">
          Commencez par créer votre première histoire personnalisée !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full">
      {/* Stories feed */}
      {stories.map((story) => (
        <FeedCard
          key={story.id}
          story={story}
          onClick={() => handleStoryClick(story)}
          onToggleFavorite={onToggleFavorite}
          onShare={onShare}
          onCreateSequel={onCreateSequel}
          onSeriesClick={onSeriesClick}
          isUpdatingFavorite={isUpdatingFavorite}
        />
      ))}

      {/* Load more trigger */}
      <div ref={loadMoreRef} className="py-4">
        {isLoadingMore && (
          <div className="flex justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        {!hasMore && stories.length > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            Vous avez vu toutes vos histoires
          </p>
        )}
      </div>
    </div>
  );
};

export default FeedContainer;
