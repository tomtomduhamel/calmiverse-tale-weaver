import React, { useState } from "react";
import StoryForm from "@/components/StoryForm";
import StoryReader from "@/components/StoryReader";
import StoryLibrary from "@/components/StoryLibrary";
import ChildrenProfiles from "@/components/ChildrenProfiles";
import HomeHero from "@/components/home/HomeHero";
import AppLayout from "@/components/layout/AppLayout";
import { useChildren } from "@/hooks/useChildren";
import { useStories } from "@/hooks/useStories";
import { useStoryThemes } from "@/hooks/useStoryThemes";
import type { ViewType } from "@/types/views";
import type { StoryFormData } from "@/components/StoryForm";

const Index = () => {
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild } = useChildren();
  const { stories, currentStory, handleCreateStory, handleDeleteStory, setCurrentStory } = useStories();
  const { themes } = useStoryThemes();

  const handleCreateChildFromStory = () => {
    setCurrentView("profiles");
  };

  const handleStorySubmit = async (formData: StoryFormData): Promise<string> => {
    try {
      const selectedTheme = themes[0]; // Pour l'instant, on utilise le premier thème
      if (!selectedTheme) {
        throw new Error("Thème non trouvé");
      }
      const story = await handleCreateStory(formData, children, selectedTheme);
      setCurrentView("reader");
      return story; // Retourne l'histoire générée
    } catch (error) {
      console.error("Erreur lors de la création de l'histoire:", error);
      throw error; // Propage l'erreur pour qu'elle soit gérée par le composant StoryForm
    }
  };

  return (
    <AppLayout currentView={currentView} onViewChange={setCurrentView}>
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
          onSelectStory={(story) => {
            setCurrentStory(story.preview);
            setCurrentView("reader");
          }}
          onDeleteStory={handleDeleteStory}
        />
      )}

      {currentView === "reader" && (
        <StoryReader
          story={currentStory}
          onClose={() => setCurrentView("library")}
        />
      )}
    </AppLayout>
  );
};

export default Index;