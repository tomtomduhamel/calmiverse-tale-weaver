
import React, { useEffect, useState } from "react";
import type { ViewType } from "@/types/views";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useStories } from "@/hooks/useStories";
import { initializeObjectives } from "@/utils/initializeObjectives";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { SimpleLoader } from "@/components/ui/SimpleLoader";
import { ErrorDisplay } from "@/components/ui/ErrorDisplay";
import { useViewManagement } from "@/hooks/useViewManagement";
import { useStoryManagement } from "@/hooks/useStoryManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import MobileMenu from "@/components/MobileMenu";
import {
  HomeView,
  CreateStoryView,
  ProfilesView,
  LibraryView,
  ReaderView
} from "./views";

const Index = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild, loading: childrenLoading } = useSupabaseChildren();
  const { stories, createStory, deleteStory } = useStories(children);
  const { currentView, setCurrentView, showGuide } = useViewManagement();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();
  const isMobile = useIsMobile();
  
  const {
    currentStory,
    handleStorySubmit,
    handleStoryCreated,
    handleCloseReader,
    handleSelectStory
  } = useStoryManagement(createStory, deleteStory, setCurrentView);

  // Rediriger vers la page de connexion si l'utilisateur n'est pas connecté
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("Utilisateur non connecté, redirection vers /auth");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  
  // Effet pour initialiser l'application
  useEffect(() => {
    console.log("Index component mounted, initializing");
    
    try {
      initializeObjectives();
      setIsInitialized(true);
      console.log("Index initialization completed successfully");
    } catch (err) {
      console.error("Error during Index initialization:", err);
    }
  }, []);

  const handleCreateChildFromStory = () => {
    setCurrentView("profiles");
  };

  // État de chargement - afficher un loader simple mais fiable
  if (authLoading || !isInitialized || stories.isLoading || childrenLoading) {
    return <SimpleLoader />;
  }

  // Gestion des erreurs de chargement des données
  if (stories.error) {
    return <ErrorDisplay message={stories.error.message} onRetry={() => window.location.reload()} />;
  }

  // Si l'utilisateur n'est pas connecté, ne pas afficher le contenu
  if (!user) {
    return <SimpleLoader />;
  }

  // Rendu principal
  return (
    <div className="h-full w-full overflow-x-hidden">
      <div className={`index-container max-w-7xl mx-auto p-2 sm:p-4 ${isMobile ? 'pb-28' : 'mb-20'}`}>
        {currentView === "home" && (
          <HomeView 
            onViewChange={setCurrentView} 
            showGuide={showGuide} 
          />
        )}

        {currentView === "create" && (
          <CreateStoryView
            onSubmit={handleStorySubmit}
            children={children}
            onCreateChild={handleCreateChildFromStory}
            onStoryCreated={handleStoryCreated}
          />
        )}

        {currentView === "profiles" && (
          <ProfilesView
            children={children}
            onAddChild={handleAddChild}
            onUpdateChild={handleUpdateChild}
            onDeleteChild={handleDeleteChild}
            onCreateStory={() => setCurrentView("create")}
          />
        )}

        {currentView === "library" && (
          <LibraryView
            stories={stories.stories}
            onSelectStory={handleSelectStory}
            onDeleteStory={deleteStory}
            onViewChange={setCurrentView}
          />
        )}

        {currentView === "reader" && currentStory && (
          <ReaderView
            story={currentStory}
            onClose={handleCloseReader}
          />
        )}
      </div>
      
      {/* Menu de navigation mobile */}
      <MobileMenu currentView={currentView} onViewChange={setCurrentView} />
    </div>
  );
};

export default Index;
