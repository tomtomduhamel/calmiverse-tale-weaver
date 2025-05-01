
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import StoryForm from "../StoryForm";
import StoryReader from "../StoryReader";
import StoryLibrary from "../StoryLibrary";
import LoadingStory from "../LoadingStory";
import type { Story } from "@/types/story";
import { useStories } from "@/hooks/useStories";

export type ViewMode = "create" | "read" | "list";

interface StoryViewProps {
  children?: any[];
  onCreateChild?: (childData: any) => Promise<any>;
}

const StoryView: React.FC<StoryViewProps> = ({ children = [], onCreateChild }) => {
  const [view, setView] = useState<ViewMode>("list");
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const { toast } = useToast();

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

  // Effet pour changer de vue lorsqu'une nouvelle histoire est sélectionnée
  useEffect(() => {
    if (currentStory && currentStory.status === 'completed' && view !== 'read') {
      setView('read');
    }
  }, [currentStory, view]);

  const handleViewChange = (newView: ViewMode) => {
    setView(newView);
  };

  const handleSelectStory = (story: Story) => {
    setCurrentStory(story);
    setView("read");
  };

  const handleBackToLibrary = () => {
    setView("list");
    setCurrentStory(null);
  };

  const handleDeleteStory = async (storyId: string) => {
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
  };

  const handleStoryCreated = async (storyId: string) => {
    console.log("Story created, ID:", storyId);
    setSelectedStoryId(storyId);
    
    // Rafraîchir la liste des histoires pour inclure la nouvelle histoire
    await stories.fetchStories();
    
    // Trouver la nouvelle histoire dans la liste
    const newStory = stories.stories?.find(s => s.id === storyId);
    if (newStory) {
      setCurrentStory(newStory);
      setView("read");
    } else {
      setView("list");
    }
  };

  const handleRetryStory = async (storyId: string) => {
    await retryFailedStory(storyId);
  };

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
          />
        ) : (
          <div>Histoire non trouvée</div>
        );
      case "list":
      default:
        return (
          <StoryLibrary
            stories={stories.stories || []}
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
  const getChildName = (childrenIds: string[], children: any[]): string | undefined => {
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
