import React, { useState, useEffect } from "react";
import StoryForm from "@/components/StoryForm";
import StoryReader from "@/components/StoryReader";
import StoryLibrary from "@/components/StoryLibrary";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import HomeHero from "@/components/home/HomeHero";
import { InteractiveGuide } from "@/components/guide/InteractiveGuide";
import type { ViewType } from "@/types/views";
import type { StoryFormData } from "@/components/story/StoryFormTypes";
import type { Story } from "@/types/story";
import { useToast } from "@/hooks/use-toast";
import { useChildren } from "@/hooks/useChildren";
import { useStories } from "@/hooks/useStories";
import { initializeObjectives } from "@/utils/initializeObjectives";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [showGuide, setShowGuide] = useState(false);
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild } = useChildren();
  const { stories, currentStory, setCurrentStory, createStory, deleteStory } = useStories(children);
  const { toast } = useToast();

  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("hasSeenGuide");
    if (!hasSeenGuide) {
      setShowGuide(true);
      localStorage.setItem("hasSeenGuide", "true");
    }

    // Initialise silencieusement les objectifs au chargement de la page
    initializeObjectives().catch(() => {
      console.error("Erreur silencieuse lors de l'initialisation des objectifs");
    });
  }, []);

  const handleCreateChildFromStory = () => {
    setCurrentView("profiles");
  };

  const handleStorySubmit = async (formData: StoryFormData): Promise<string> => {
    try {
      const story = await createStory(formData);
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
    if (story.status === 'completed' || story.status === 'read') {
      setCurrentStory(story);
      setCurrentView("reader");
    } else {
      toast({
        title: "Histoire en cours de génération",
        description: "Cette histoire n'est pas encore disponible à la lecture",
      });
    }
  };

  return (
    <>
      {showGuide && <InteractiveGuide />}
      
      {currentView === "home" && (
        <HomeHero onViewChange={setCurrentView} />
      )}

      {currentView === "create" && (
        <div className="max-w-md mx-auto animate-fade-in">
          <StoryForm 
            onSubmit={handleStorySubmit}
            children={children} 
            onCreateChild={handleCreateChildFromStory}
            onStoryCreated={handleStoryCreated}
          />
        </div>
      )}

      {currentView === "profiles" && (
        <div className="animate-fade-in">
          <ChildrenProfiles
            children={children}
            onAddChild={handleAddChild}
            onUpdateChild={handleUpdateChild}
            onDeleteChild={handleDeleteChild}
            onCreateStory={() => setCurrentView("create")}
          />
        </div>
      )}

      {currentView === "library" && (
        <div className="animate-fade-in">
          <StoryLibrary
            stories={stories}
            onSelectStory={handleSelectStory}
            onDeleteStory={deleteStory}
            onViewChange={setCurrentView}
          />
        </div>
      )}

      {currentView === "reader" && currentStory && (
        <div className="animate-fade-in">
          <StoryReader
            story={currentStory}
            onClose={handleCloseReader}
          />
        </div>
      )}
    </>
  );
};

export default Index;