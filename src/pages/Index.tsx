import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useStories } from "@/hooks/useStories";
import { initializeObjectives } from "@/utils/initializeObjectives";
import { useLocation, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

// Composant de chargement léger
const SimpleLoader = () => (
  <div className="flex justify-center items-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

const Index = () => {
  // Force l'initialisation explicite à "home" pour garantir le bon rendu
  const [currentView, setCurrentView] = useState<ViewType>("home");
  const [showGuide, setShowGuide] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild, loading: childrenLoading } = useSupabaseChildren();
  const { stories: { stories, isLoading, error }, currentStory, setCurrentStory, createStory, deleteStory } = useStories(children);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Utilisateur non connecté, redirection vers /auth");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  
  // Effet pour vérifier si le guide a déjà été vu
  useEffect(() => {
    console.log("Index component mounted, initializing");
    
    try {
      const hasSeenGuide = localStorage.getItem("hasSeenGuide");
      if (!hasSeenGuide) {
        setShowGuide(true);
        localStorage.setItem("hasSeenGuide", "true");
      }

      initializeObjectives();
      setIsInitialized(true);
      console.log("Index initialization completed successfully");
    } catch (err) {
      console.error("Error during Index initialization:", err);
    }
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

  const handleStorySubmit = async (formData: StoryFormData): Promise<string> => {
    try {
      const story = await createStory(formData);
      return story;
    } catch (error: any) {
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

  // État de chargement - afficher un loader simple mais fiable
  if (authLoading || !isInitialized || isLoading || childrenLoading) {
    return <SimpleLoader />;
  }

  // Gestion des erreurs de chargement des données
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Erreur de chargement:</h3>
        <p>{error.message}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  // Si l'utilisateur n'est pas connecté, ne pas afficher le contenu
  if (!user) {
    return <SimpleLoader />;
  }

  // Rendu principal
  return (
    <ScrollArea className="h-screen w-full">
      <div className="index-container max-w-7xl mx-auto p-4 mb-20">
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
      </div>
    </ScrollArea>
  );
};

export default Index;
