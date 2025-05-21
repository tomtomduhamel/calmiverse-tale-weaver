
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import LibraryHeader from "./library/LibraryHeader";
import LibraryFilters from "./library/filters/LibraryFilters";
import StoryGrid from "./library/StoryGrid";
import Pagination from "./library/Pagination";
import StoryCleaner from "./library/StoryCleaner";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { Button } from "./ui/button";

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onRetryStory?: (storyId: string) => void;
  onViewChange?: (view: ViewType) => void;
  isRetrying?: boolean;
  pendingStoryId?: string | null;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  stories, 
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  onViewChange,
  isRetrying = false,
  pendingStoryId
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'ready' | 'read' | 'error'>('all');
  const [isZenMode, setIsZenMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const storiesPerPage = 6;

  // Modified to adapt between different function signatures
  const handleDelete = async (storyId: string) => {
    try {
      console.log("Tentative de suppression de l'histoire:", storyId);
      setIsDeletingId(storyId);
      
      if (onDeleteStory) {
        await onDeleteStory(storyId);
        toast({
          title: "Histoire supprimée",
          description: "L'histoire a été supprimée avec succès",
        });
      } else {
        console.error("Fonction onDeleteStory non définie");
        toast({
          title: "Erreur",
          description: "Impossible de supprimer l'histoire: fonction non disponible",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de la suppression:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    } finally {
      setIsDeletingId(null);
    }
  };

  // Modified to adapt between different function signatures
  const handleRetry = async (storyId: string) => {
    if (onRetryStory) {
      try {
        console.log("Tentative de relance de l'histoire:", storyId);
        await onRetryStory(storyId);
      } catch (error) {
        console.error("Erreur lors de la relance:", error);
      }
    }
  };

  // Gestionnaire de sélection d'histoire avec meilleure traçabilité
  const handleStorySelect = (story: Story) => {
    console.log("StoryLibrary: Histoire sélectionnée:", story.id, "status:", story.status);
    
    // On vérifie si l'histoire est cliquable avant de propager l'événement
    if (story.status === "ready" || story.status === "read") {
      console.log("StoryLibrary: L'histoire est prête ou déjà lue, on peut la sélectionner");
      onSelectStory(story);
    } else {
      console.log("StoryLibrary: L'histoire n'est pas encore disponible, status:", story.status);
      toast({
        title: "Histoire non disponible",
        description: story.status === "pending" 
          ? "Cette histoire est encore en cours de génération." 
          : "Cette histoire n'est pas disponible pour la lecture.",
        variant: "destructive"
      });
    }
  };

  const filteredStories = stories
    .filter(story => {
      const matchesSearch = (story.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                          (story.preview?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const getPriority = (story: Story) => {
        if (story.status === 'error') {
          return 0; // Show errors first
        }
        if (story.status === 'pending') {
          return 1; // Show pending second
        }
        if (story.isFavorite) {
          return story.status === 'read' ? 3 : 2;
        }
        return story.status === 'read' ? 5 : 4;
      };

      const priorityA = getPriority(a);
      const priorityB = getPriority(b);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return b.createdAt.getTime() - a.createdAt.getTime();
    });

  // Count error stories
  const errorStories = stories.filter(story => story.status === 'error');

  return (
    <div className={`space-y-6 p-4 transition-all duration-300 ${isZenMode ? 'bg-neutral-50' : ''}`}>
      <LibraryHeader 
        isZenMode={isZenMode}
        onZenModeToggle={() => setIsZenMode(!isZenMode)}
        onCreateStory={() => onViewChange?.("create")}
      />

      {errorStories.length > 0 && (
        <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Histoires en erreur</AlertTitle>
          <AlertDescription className="flex flex-col space-y-2">
            <p>Nous avons détecté {errorStories.length} histoire(s) qui n'ont pas pu être générées.</p>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs border-red-300 hover:bg-red-100"
                onClick={() => setStatusFilter('error')}
              >
                Voir les histoires en erreur
              </Button>
              {errorStories.length === 1 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs border-green-300 hover:bg-green-100 flex items-center"
                  onClick={() => handleRetry(errorStories[0].id)}
                  disabled={isRetrying}
                  type="button"
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Réessayer cette histoire
                </Button>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

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
        stories={filteredStories.slice(
          (currentPage - 1) * storiesPerPage,
          currentPage * storiesPerPage
        )}
        onDelete={handleDelete}
        onRetry={handleRetry}
        onCardClick={handleStorySelect}
        isRetrying={isRetrying}
        isDeletingId={isDeletingId}
        pendingStoryId={pendingStoryId}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(filteredStories.length / storiesPerPage)}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StoryLibrary;
