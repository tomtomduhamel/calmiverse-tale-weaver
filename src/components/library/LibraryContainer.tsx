
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

  // Filtrage et tri amélioré des histoires
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
          case 'unread':
            matchesStatus = story.status !== 'read' && story.status !== 'error';
            break;
          case 'recent':
            matchesStatus = isRecentStory(story);
            break;
          default:
            matchesStatus = story.status === statusFilter;
        }
        
        // Filter by objective (single selection)
        const matchesObjective = !selectedObjective || 
          extractObjectiveValue(story.objective) === selectedObjective;
        
        return matchesSearch && matchesStatus && matchesObjective;
      })
      .sort((a, b) => {
        // Nouveau système de priorités amélioré
        const getPriority = (story: Story) => {
          const isRecent = isRecentStory(story);
          
          // Priorité 0 : Histoires récentes (moins de 24h) avec statut critique
          if (isRecent && (story.status === 'error' || story.status === 'pending')) return 0;
          
          // Priorité 1 : Histoires récentes prêtes ou non lues
          if (isRecent && (story.status === 'ready' || story.status !== 'read')) return 1;
          
          // Priorité 2 : Histoires récentes lues
          if (isRecent && story.status === 'read') return 2;
          
          // Priorité 3 : Favoris non récents avec problèmes
          if (story.isFavorite && story.status === 'error') return 3;
          
          // Priorité 4 : Favoris non récents en génération
          if (story.isFavorite && story.status === 'pending') return 4;
          
          // Priorité 5 : Favoris non récents non lus
          if (story.isFavorite && story.status !== 'read') return 5;
          
          // Priorité 6 : Favoris non récents lus
          if (story.isFavorite && story.status === 'read') return 6;
          
          // Priorité 7 : Histoires non récentes avec erreurs
          if (story.status === 'error') return 7;
          
          // Priorité 8 : Histoires non récentes en génération
          if (story.status === 'pending') return 8;
          
          // Priorité 9 : Histoires non récentes prêtes
          if (story.status === 'ready') return 9;
          
          // Priorité 10 : Histoires non récentes lues
          return 10;
        };

        const priorityA = getPriority(a);
        const priorityB = getPriority(b);

        if (priorityA !== priorityB) return priorityA - priorityB;
        
        // En cas d'égalité de priorité, tri par date de création (plus récent en premier)
        return b.createdAt.getTime() - a.createdAt.getTime();
      });
  }, [stories, searchTerm, statusFilter, selectedObjective, isRecentStory]);

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
          stories={currentStories}
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
