
import React from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import LibraryHeader from "./LibraryHeader";
import LibraryFilters from "./filters/LibraryFilters";
import LibraryErrorAlert from "./LibraryErrorAlert";
import StoryGrid from "./StoryGrid";
import Pagination from "./Pagination";
import StoryCleaner from "./StoryCleaner";

interface LibraryContainerProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onRetryStory?: (storyId: string) => void;
  onToggleFavorite?: (storyId: string, currentFavoriteStatus: boolean) => void;
  onViewChange?: (view: ViewType) => void;
  isRetrying?: boolean;
  isDeletingId?: string | null;
  isUpdatingFavorite?: boolean;
  pendingStoryId?: string | null;
  onCreateStory?: () => void;
}

const LibraryContainer: React.FC<LibraryContainerProps> = ({
  stories,
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  onToggleFavorite,
  onViewChange,
  isRetrying = false,
  isDeletingId,
  isUpdatingFavorite = false,
  pendingStoryId,
  onCreateStory
}) => {
  // États locaux pour la pagination et le filtrage
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'pending' | 'ready' | 'read' | 'error' | 'favorites'>('all');
  const [isZenMode, setIsZenMode] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const storiesPerPage = 6;

  // Filtrage et tri des histoires avec gestion des favoris
  const filteredStories = React.useMemo(() => {
    return stories
      .filter(story => {
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
          default:
            matchesStatus = story.status === statusFilter;
        }
        
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        // Priorisation pour l'affichage des favoris
        const getPriority = (story: Story) => {
          // Les favoris non lus en premier
          if (story.isFavorite && story.status !== 'read') return 0;
          // Les histoires en erreur ensuite
          if (story.status === 'error') return 1;
          // Les histoires en génération
          if (story.status === 'pending') return 2;
          // Les favoris lus
          if (story.isFavorite && story.status === 'read') return 3;
          // Les histoires prêtes non favorites
          if (story.status === 'ready') return 4;
          // Les histoires lues non favorites
          return 5;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        if (priorityA !== priorityB) return priorityA - priorityB;
        
        // Tri par date de création pour histoires de même priorité
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }, [stories, searchTerm, statusFilter]);

  // Nombre total de pages pour la pagination
  const totalPages = Math.ceil(filteredStories.length / storiesPerPage);

  // Histoires à afficher sur la page actuelle
  const currentStories = filteredStories.slice(
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
    <div className={`space-y-6 p-4 transition-all duration-300 ${isZenMode ? 'bg-neutral-50' : ''}`}>
      <LibraryHeader 
        isZenMode={isZenMode}
        onZenModeToggle={() => setIsZenMode(!isZenMode)}
        onCreateStory={handleCreateStory}
      />

      <LibraryErrorAlert 
        errorStories={errorStories}
        onViewErrorStories={() => setStatusFilter('error')}
        onRetryStory={(storyId) => onRetryStory?.(storyId)}
        isRetrying={isRetrying}
      />

      <div className="flex justify-between items-center">
        <LibraryFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
        />
        <StoryCleaner stories={stories} />
      </div>

      <StoryGrid
        stories={currentStories}
        onDelete={onDeleteStory}
        onRetry={onRetryStory}
        onToggleFavorite={onToggleFavorite}
        onCardClick={onSelectStory}
        isRetrying={isRetrying}
        isDeletingId={isDeletingId}
        isUpdatingFavorite={isUpdatingFavorite}
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
