/**
 * Library Feed - Instagram-style story feed
 * Responsive: mobile = single column edge-to-edge, desktop = centered with sidebar
 * Series stories open a modal with full series overview
 */

import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInfiniteStories } from "@/hooks/stories/useInfiniteStories";
import { useSeriesDetails } from "@/hooks/stories/useSeriesDetails";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedContainer, PillFilters, FocusSidebar } from "./feed";
import { StoriesInProgressSection } from "./sections/StoriesInProgressSection";
import { SeriesStoriesModal } from "./series/SeriesStoriesModal";
import type { Story } from "@/types/story";

interface LibraryFeedProps {
  onCreateSequel?: (storyId: string) => void;
  onShare?: (storyId: string) => void;
}

const LibraryFeed: React.FC<LibraryFeedProps> = ({
  onCreateSequel,
  onShare,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [selectedObjective, setSelectedObjective] = useState<string | null>(null);
  
  // Series modal state
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);
  const { seriesGroup, isLoading: isLoadingSeries } = useSeriesDetails(selectedSeriesId);
  
  // Debounce search term to avoid excessive API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // Infinite scroll hook
  const {
    stories,
    isLoading,
    isLoadingMore,
    hasMore,
    fetchNextPage,
    toggleFavorite,
    refresh,
  } = useInfiniteStories({
    objectiveFilter: selectedObjective,
    searchTerm: debouncedSearchTerm || undefined,
  });

  // Listen for library refresh event (from pull-to-refresh)
  useEffect(() => {
    const handleLibraryRefresh = () => {
      refresh();
    };

    window.addEventListener('library-refresh', handleLibraryRefresh);
    return () => {
      window.removeEventListener('library-refresh', handleLibraryRefresh);
    };
  }, [refresh]);

  // Handle story selection for sidebar / navigation
  const handleSelectStory = useCallback((story: Story) => {
    if (story.status === 'pending') {
      toast({
        title: "Histoire en cours de génération",
        description: "Veuillez patienter, l'histoire sera bientôt prête.",
      });
      return;
    }
    navigate(`/reader/${story.id}`);
  }, [navigate, toast]);

  // Handle series click - open modal
  const handleSeriesClick = useCallback((story: Story) => {
    if (story.series_id) {
      setSelectedSeriesId(story.series_id);
    }
  }, []);

  // Handle closing series modal
  const handleCloseSeriesModal = useCallback(() => {
    setSelectedSeriesId(null);
  }, []);

  // Handle story selection from series modal
  const handleSelectSeriesStory = useCallback((story: Story) => {
    if (story.status === 'pending') {
      toast({
        title: "Histoire en cours de génération",
        description: "Veuillez patienter, l'histoire sera bientôt prête.",
      });
      return;
    }
    setSelectedSeriesId(null); // Close modal
    navigate(`/reader/${story.id}`);
  }, [navigate, toast]);

  // Handle sequel creation
  const handleCreateSequel = useCallback((storyId: string) => {
    if (onCreateSequel) {
      onCreateSequel(storyId);
    }
    toast({
      title: "Création de la suite",
      description: "La suite de votre histoire est en cours de génération.",
    });
  }, [onCreateSequel, toast]);

  return (
    <div className="w-full">
      {/* Main layout */}
      <div className="flex gap-6">
        {/* Main feed column */}
        <div className={`flex-1 ${isMobile ? '' : 'max-w-[650px]'}`}>
          {/* Sticky header with search and filters */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-3 pt-4">
            {/* Search bar */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher une histoire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-card"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Pill filters with internal padding */}
            <PillFilters
              selectedObjective={selectedObjective}
              onObjectiveChange={setSelectedObjective}
            />
          </div>

          {/* Stories in progress section */}
          <StoriesInProgressSection />

          {/* Feed */}
          <div className="mt-4">
            <FeedContainer
              stories={stories}
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onLoadMore={fetchNextPage}
              onToggleFavorite={toggleFavorite}
              onShare={onShare}
              onCreateSequel={handleCreateSequel}
              onSeriesClick={handleSeriesClick}
            />
          </div>
        </div>

        {/* Desktop sidebar - Focus Mode */}
        {!isMobile && (
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <FocusSidebar
                stories={stories}
                onSelectStory={handleSelectStory}
                className="bg-card rounded-lg border"
              />
            </div>
          </aside>
        )}
      </div>

      {/* Series Stories Modal */}
      {seriesGroup && (
        <SeriesStoriesModal
          isOpen={Boolean(selectedSeriesId)}
          onClose={handleCloseSeriesModal}
          seriesGroup={seriesGroup}
          onSelectStory={handleSelectSeriesStory}
          onToggleFavorite={toggleFavorite}
        />
      )}
    </div>
  );
};

export default LibraryFeed;
