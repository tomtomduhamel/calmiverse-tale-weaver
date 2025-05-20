
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import StoryForm from "../StoryForm";
import StoryReader from "../StoryReader";
import StoryLibrary from "../StoryLibrary";
import LoadingStory from "../LoadingStory";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";
import { useStories } from "@/hooks/useStories";
import type { Child } from "@/types/child";
import { useStoryUpdate } from "@/hooks/stories/useStoryUpdate";

export type ViewMode = "create" | "read" | "list";

interface StoryViewProps {
  children?: Child[];
  onCreateChild?: (childData: Omit<Child, "id">) => Promise<string>;
}

const StoryView: React.FC<StoryViewProps> = ({ children = [], onCreateChild = async () => "" }) => {
  const [view, setView] = useState<ViewMode>("list");
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const { toast } = useToast();
  const { updateStoryStatus } = useStoryUpdate();

  const {
    stories,
    currentStory,
    setCurrentStory,
    createStory,
    deleteStory,
    retryFailedStory,
    lastError,
    isRetrying,
  } = useStories(children);

  // Effect to change view when a new story is selected
  useEffect(() => {
    if (currentStory && currentStory.status === 'completed' && view !== 'read') {
      setView('read');
    }
  }, [currentStory, view]);

  // Use useCallback to prevent unnecessary re-renders
  const handleViewChange = useCallback((newView: ViewType) => {
    // Convert ViewType to ViewMode if it matches any of the ViewMode values
    if (newView === "create") {
      setView("create");
    } else if (newView === "library") {
      setView("list");
    } else if (newView === "reader") {
      setView("read");
    }
    // Ignore other ViewType values that don't map to ViewMode
  }, []);

  const handleSelectStory = useCallback((story: Story) => {
    setCurrentStory(story);
    setView("read");
  }, [setCurrentStory]);

  const handleBackToLibrary = useCallback(() => {
    setView("list");
    setCurrentStory(null);
  }, [setCurrentStory]);

  const handleDeleteStory = useCallback(async (storyId: string) => {
    try {
      await deleteStory(storyId);
      toast({
        title: "Histoire supprimée",
        description: "L'histoire a été supprimée avec succès",
      });
    } catch (error) {
      console.error("Error deleting story:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
    }
  }, [deleteStory, toast]);

  const handleMarkAsRead = useCallback(async (storyId: string) => {
    try {
      await updateStoryStatus(storyId, "read");
      
      // Mettre à jour l'histoire actuelle si c'est celle qui vient d'être marquée comme lue
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory({
          ...currentStory,
          status: "read"
        });
      }
      
      // Rafraîchir la liste pour mettre à jour le statut dans la bibliothèque
      await stories.fetchStories();
      
      toast({
        title: "Histoire marquée comme lue",
        description: "Le statut de l'histoire a été mis à jour",
      });
    } catch (error) {
      console.error("Error marking story as read:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
    }
  }, [updateStoryStatus, currentStory, stories, toast, setCurrentStory]);

  const handleStoryCreated = useCallback(async (story: Story) => {
    console.log("Story created:", story);
    setSelectedStoryId(story.id);
    
    // Refresh the story list to include the new story
    await stories.fetchStories();
    
    // Find the new story in the list
    const newStory = stories.stories.find(s => s.id === story.id);
    if (newStory) {
      setCurrentStory(newStory);
      setView("read");
    } else {
      setView("list");
    }
  }, [stories, setCurrentStory]);

  const handleRetryStory = useCallback(async (storyId: string) => {
    await retryFailedStory(storyId);
  }, [retryFailedStory]);

  // Render different views based on the current state
  const renderView = () => {
    if (stories.isLoading) {
      return <LoadingStory />;
    }

    switch (view) {
      case "create":
        return (
          <StoryForm
            onSubmit={createStory}
            children={children}
            onCreateChild={onCreateChild}
            onStoryCreated={handleStoryCreated}
          />
        );
      case "read":
        return currentStory ? (
          <StoryReader
            story={currentStory}
            onClose={handleBackToLibrary}
            onBack={handleBackToLibrary}
            childName={getChildName(currentStory.childrenIds, children)}
            onMarkAsRead={handleMarkAsRead}
          />
        ) : (
          <div>Histoire non trouvée</div>
        );
      case "list":
      default:
        return (
          <StoryLibrary
            stories={stories.stories}
            onSelectStory={handleSelectStory}
            onDeleteStory={handleDeleteStory}
            onRetryStory={handleRetryStory}
            onViewChange={handleViewChange}
            isRetrying={isRetrying}
          />
        );
    }
  };

  // Helper function to get child name based on childrenIds
  const getChildName = (childrenIds: string[], children: Child[]): string | undefined => {
    if (!childrenIds || childrenIds.length === 0 || !children || children.length === 0) {
      return undefined;
    }
    
    const childId = childrenIds[0];
    const child = children.find(c => c.id === childId);
    return child ? child.name : undefined;
  };

  return <div className="container mx-auto">{renderView()}</div>;
};

export default StoryView;
