import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";
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
  onViewChange?: (view: "create") => void;
  isRetrying?: boolean;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  stories, 
  onSelectStory,
  onDeleteStory,
  onRetryStory,
  onViewChange,
  isRetrying = false
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'read' | 'error'>('all');
  const [isZenMode, setIsZenMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const storiesPerPage = 6;

  const handleDelete = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (onDeleteStory) {
      onDeleteStory(storyId);
      toast({
        title: "Histoire supprimée",
        description: "L'histoire a été supprimée avec succès",
      });
    }
  };

  const handleRetry = (e: React.MouseEvent, storyId: string) => {
    e.stopPropagation();
    if (onRetryStory) {
      onRetryStory(storyId);
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
                  onClick={(e) => handleRetry(e, errorStories[0].id)}
                  disabled={isRetrying}
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
        onCardClick={onSelectStory}
        isRetrying={isRetrying}
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
