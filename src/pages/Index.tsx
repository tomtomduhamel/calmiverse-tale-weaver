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
      setCurrentView("reader");
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

  const handleCloseReader = () => {
    setCurrentView("library");
    setCurrentStory(null);
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
          onSelectStory={(story: Story) => {
            const completeStory: Story = {
              ...story,
              content: story.content || "",
              childrenIds: story.childrenIds || [],
              story_text: story.story_text || "",
              story_summary: story.story_summary || "",
            };
            setCurrentStory(completeStory);
            setCurrentView("reader");
          }}
          onDeleteStory={handleDeleteStory}
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