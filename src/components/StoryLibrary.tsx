import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";
import LibraryHeader from "./library/LibraryHeader";
import StoryFilters from "./library/StoryFilters";
import StoryGrid from "./library/StoryGrid";
import Pagination from "./library/Pagination";

interface StoryLibraryProps {
  stories: Story[];
  onSelectStory: (story: Story) => void;
  onDeleteStory?: (storyId: string) => void;
  onViewChange?: (view: "create") => void;
}

const StoryLibrary: React.FC<StoryLibraryProps> = ({ 
  stories, 
  onSelectStory,
  onDeleteStory,
  onViewChange 
}) => {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');
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

  const filteredStories = stories
    .filter(story => {
      const matchesSearch = (story.title?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                          (story.preview?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
      const matchesStatus = statusFilter === 'all' || story.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

  const indexOfLastStory = currentPage * storiesPerPage;
  const indexOfFirstStory = indexOfLastStory - storiesPerPage;
  const currentStories = filteredStories.slice(indexOfFirstStory, indexOfLastStory);
  const totalPages = Math.ceil(filteredStories.length / storiesPerPage);

  return (
    <div className={`space-y-6 p-4 transition-all duration-300 ${isZenMode ? 'bg-neutral-50' : ''}`}>
      <LibraryHeader 
        isZenMode={isZenMode}
        onZenModeToggle={() => setIsZenMode(!isZenMode)}
        onCreateStory={() => onViewChange?.("create")}
      />

      <StoryFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />

      <StoryGrid
        stories={currentStories}
        onDelete={handleDelete}
        onCardClick={onSelectStory}
      />

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default StoryLibrary;