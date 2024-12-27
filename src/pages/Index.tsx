import React, { useState } from "react";
import StoryForm from "@/components/StoryForm";
import StoryReader from "@/components/StoryReader";
import StoryLibrary from "@/components/StoryLibrary";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import HomeHero from "@/components/home/HomeHero";
import type { ViewType } from "@/types/views";
import type { StoryFormData } from "@/components/StoryForm";
import type { Story } from "@/types/story";
import { useToast } from "@/hooks/use-toast";
import { useChildren } from "@/hooks/useChildren";
import { useStories } from "@/hooks/useStories";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild } = useChildren();
  const { stories, currentStory, handleCreateStory, handleDeleteStory, setCurrentStory } = useStories();
  const { toast } = useToast();

  const handleCreateChildFromStory = () => {
    setCurrentView("profiles");
  };

  const handleStorySubmit = async (formData: StoryFormData): Promise<string> => {
    try {
      const story = await handleCreateStory(formData, children);
      return story;
    } catch (error) {
      console.error("Erreur lors de la création de l'histoire:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleStoryCreated = (story: Story) => {
    setCurrentStory(story);
    setCurrentView("reader");
  };

  const handleCloseReader = () => {
    setCurrentView("library");
    setCurrentStory(null);
  };

  const handleSelectStory = (story: Story) => {
    setCurrentStory(story);
    setCurrentView("reader");
  };

  return (
    <>
      {currentView === "home" && (
        <HomeHero onViewChange={setCurrentView} />
      )}

      {currentView === "create" && (
        <div className="max-w-md mx-auto">
          <StoryForm 
            onSubmit={handleStorySubmit}
            children={children} 
            onCreateChild={handleCreateChildFromStory}
            onStoryCreated={handleStoryCreated}
          />
        </div>
      )}

      {currentView === "profiles" && (
        <ChildrenProfiles
          children={children}
          onAddChild={handleAddChild}
          onUpdateChild={handleUpdateChild}
          onDeleteChild={handleDeleteChild}
        />
      )}

      {currentView === "library" && (
        <StoryLibrary
          stories={stories}
          onSelectStory={handleSelectStory}
          onDeleteStory={handleDeleteStory}
          onViewChange={setCurrentView}
        />
      )}

      {currentView === "reader" && (
        <StoryReader
          story={currentStory}
          onClose={handleCloseReader}
        />
      )}
    </>
  );
};

export default Index;