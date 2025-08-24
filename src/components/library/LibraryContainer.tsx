
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import LibraryHeader from "./LibraryHeader";
import LibraryFilters from "./filters/LibraryFilters";
import MobileFilters from "./MobileFilters";
import { useIsMobile } from "@/hooks/use-mobile";
import LibraryErrorAlert from "./LibraryErrorAlert";
import StoryGrid from "./StoryGrid";
import Pagination from "./Pagination";
import StoryCleaner from "./StoryCleaner";
import { extractObjectiveValue } from "@/utils/objectiveUtils";
import { useSeriesGrouping } from "@/hooks/stories/useSeriesGrouping";

interface LibraryContainerProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onRetryStory?: (storyId: string) => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  onSequelCreated?: (storyId: string) => void;
  onViewChange?: (view: ViewType) => void;
  isRetrying?: boolean;
  isDeletingId?: string | null;
  isUpdatingFavorite?: boolean;
  isUpdatingReadStatus?: boolean;
  pendingStoryId?: string | null;
  onCreateStory?: () => void;
}

const LibraryContainer: React.FC<LibraryContainerProps> = ({
  stories,
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  onToggleFavorite,
  onMarkAsRead,
  onSequelCreated,
  onViewChange,
  isRetrying = false,
  isDeletingId,
  isUpdatingFavorite = false,
  isUpdatingReadStatus = false,
  pendingStoryId,
  onCreateStory
}) => {
  const isMobile = useIsMobile();
  
  // Grouper les histoires en séries
  const { libraryItems } = useSeriesGrouping(stories);
  
  // États locaux pour la pagination et le filtrage
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent'>('all');
  const [selectedObjective, setSelectedObjective] = React.useState<string | null>(null);
  const [isZenMode, setIsZenMode] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const storiesPerPage = isMobile ? 8 : 6;

  // Fonction pour vérifier si une histoire est récente (dernières 24h)
  const isRecentStory = (story: Story): boolean => {
    const now = new Date();
    const storyDate = new Date(story.createdAt);
    const hoursDiff = (now.getTime() - storyDate.getTime()) / (1000 * 60 * 60);
    return hoursDiff <= 24;
  };

  // Filtrage et tri amélioré des éléments de la bibliothèque
  const filteredItems = React.useMemo(() => {
    return libraryItems
      .filter(item => {
        if (item.type === 'series') {
          const matchesSearch = searchTerm ? (
            item.series.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.series.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.stories.some(story => 
              story.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
              story.preview?.toLowerCase().includes(searchTerm.toLowerCase())
            )
          ) : true;
          
          let matchesStatus = false;
          switch (statusFilter) {
            case 'all':
              matchesStatus = true;
              break;
            case 'favorites':
              matchesStatus = item.stories.some(story => story.isFavorite === true);
              break;
            case 'unread':
              matchesStatus = item.stories.some(story => story.status !== 'read' && story.status !== 'error');
              break;
            case 'recent':
              matchesStatus = item.stories.some(story => isRecentStory(story));
              break;
            default:
              matchesStatus = item.stories.some(story => story.status === statusFilter);
          }
          
          const matchesObjective = !selectedObjective || 
            item.stories.some(story => extractObjectiveValue(story.objective) === selectedObjective);
          
          return matchesSearch && matchesStatus && matchesObjective;
        } else {
          const story = item.story;
          const matchesSearch = (story.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                              (story.preview?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
          
          let matchesStatus = false;
          switch (statusFilter) {
            case 'all':
              matchesStatus = true;
              break;
            case 'favorites':
              matchesStatus = story.isFavorite === true;
              break;
            case 'unread':
              matchesStatus = story.status !== 'read' && story.status !== 'error';
              break;
            case 'recent':
              matchesStatus = isRecentStory(story);
              break;
            default:
              matchesStatus = story.status === statusFilter;
          }
          
          const matchesObjective = !selectedObjective || 
            extractObjectiveValue(story.objective) === selectedObjective;
          
          return matchesSearch && matchesStatus && matchesObjective;
        }
      })
      .sort((a, b) => {
        // Pour les séries, on utilise la date de mise à jour de la série
        const getItemDate = (item: any) => {
          if (item.type === 'series') {
            return new Date(item.lastUpdated);
          } else {
            return item.story.updatedAt || item.story.createdAt;
          }
        };

        const getItemIsRecent = (item: any) => {
          if (item.type === 'series') {
            return item.stories.some((story: any) => isRecentStory(story));
          } else {
            return isRecentStory(item.story);
          }
        };

        // Priority 1: Recent items first
        const aIsRecent = getItemIsRecent(a);
        const bIsRecent = getItemIsRecent(b);
        if (aIsRecent && !bIsRecent) return -1;
        if (!aIsRecent && bIsRecent) return 1;

        // Priority 2: Most recent update first
        const aDate = getItemDate(a);
        const bDate = getItemDate(b);
        return new Date(bDate).getTime() - new Date(aDate).getTime();
      });
  }, [libraryItems, searchTerm, statusFilter, selectedObjective, isRecentStory]);

  // Nombre total de pages pour la pagination
  const totalPages = Math.ceil(filteredItems.length / storiesPerPage);

  // Éléments à afficher sur la page actuelle
  const currentItems = filteredItems.slice(
    (currentPage - 1) * storiesPerPage,
    currentPage * storiesPerPage
  );

  // Histoires en erreur pour l'alerte
  const errorStories = stories.filter(story => story.status === 'error');

  const handleCreateStory = () => {
    if (onCreateStory) {
      onCreateStory();
    } else if (onViewChange) {
      onViewChange("create");
    }
  };

  return (
    <div className={`space-y-3 sm:space-y-6 p-2 sm:p-4 transition-all duration-300 ${isZenMode ? 'bg-neutral-50' : ''}`}>
      <LibraryHeader 
        isZenMode={isZenMode}
        onZenModeToggle={() => setIsZenMode(!isZenMode)}
      />

      <LibraryErrorAlert 
        errorStories={errorStories}
        onViewErrorStories={() => setStatusFilter('error')}
        onRetryStory={(storyId) => onRetryStory?.(storyId)}
        isRetrying={isRetrying}
      />

      {isMobile ? (
        <MobileFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          selectedObjective={selectedObjective}
          onObjectiveChange={setSelectedObjective}
        />
      ) : (
        <div className="flex justify-between items-center">
          <LibraryFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            selectedObjective={selectedObjective}
            onObjectiveChange={setSelectedObjective}
          />
          <StoryCleaner stories={stories} />
        </div>
      )}

        <StoryGrid
          items={currentItems}
          onDelete={onDeleteStory}
          onRetry={onRetryStory}
          onToggleFavorite={onToggleFavorite}
          onMarkAsRead={onMarkAsRead}
          onSequelCreated={onSequelCreated}
          onCardClick={onSelectStory}
          isRetrying={isRetrying}
          isDeletingId={isDeletingId}
          isUpdatingFavorite={isUpdatingFavorite}
          isUpdatingReadStatus={isUpdatingReadStatus}
          pendingStoryId={pendingStoryId}
        />

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
};

export default LibraryContainer;
