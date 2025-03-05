
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
import { useLocation } from "react-router-dom";

const Index = () => {
  // Définir explicitement le state initial à "home"
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [showGuide, setShowGuide] = useState(false);
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild } = useChildren();
  const { stories: { stories, isLoading, error }, currentStory, setCurrentStory, createStory, deleteStory } = useStories(children);
  const { toast } = useToast();
  const location = useLocation();

  // Effet pour vérifier si le guide a déjà été vu
  useEffect(() => {
    console.log("Index component mounted");
    const hasSeenGuide = localStorage.getItem("hasSeenGuide");
    if (!hasSeenGuide) {
      setShowGuide(true);
      localStorage.setItem("hasSeenGuide", "true");
    }

    initializeObjectives();
  }, []);

  // Effet pour réinitialiser la vue à "home" quand on navigue vers "/"
  useEffect(() => {
    console.log("Location changed:", location.pathname);
    if (location.pathname === "/") {
      console.log("Setting view to home");
      setCurrentView("home");
    }
  }, [location]);

  // Log lors des changements de vue
  useEffect(() => {
    console.log("Current view changed to:", currentView);
  }, [currentView]);

  const handleCreateChildFromStory = () => {
    setCurrentView("profiles");
  };

  const handleModeSwitch = () => {
    setCreationMode(mode => mode === "classic" ? "chat" : "classic");
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

  console.log("Rendering Index component with view:", currentView);
  console.log("Loading state:", isLoading);
  console.log("Error state:", error);

  // Rendre une UI de chargement améliorée
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Améliorer l'affichage des erreurs
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Erreur:</h3>
        <p>{error.message}</p>
      </div>
    );
  }

  // Rendu principal avec affichage conditionnel basé sur currentView
  return (
    <>
      {showGuide && <InteractiveGuide />}
      
      {currentView === "home" && (
        <HomeHero onViewChange={setCurrentView} />
      )}

      {currentView === "create" && (
        <div className="w-full max-w-4xl mx-auto animate-fade-in">
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
