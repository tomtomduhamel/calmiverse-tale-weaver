
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useStories } from "@/hooks/useStories";
import { useViewManagement } from "@/hooks/useViewManagement";
import { useStoryManagement } from "@/hooks/useStoryManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { initializeObjectives } from "@/utils/initializeObjectives";
import type { Story } from "@/types/story";
import type { Child } from "@/types/child";

export const useIndexPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild, loading: childrenLoading } = useSupabaseChildren();
  const { stories, createStory, deleteStory, retryFailedStory, isRetrying } = useStories(children);
  const { currentView, setCurrentView, showGuide } = useViewManagement();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  const {
    currentStory,
    setCurrentStory,
    handleStorySubmit,
    handleStoryCreated,
    handleCloseReader,
    handleDeleteStory,
    handleRetryStory,
    handleMarkAsRead
  } = useStoryManagement();

  // Redirect to login page if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not logged in, redirecting to /auth");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  
  // Effect to initialize the application
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

  // Effect to check the status of a pending story
  useEffect(() => {
    if (!pendingStoryId || !stories.stories) return;
    
    const pendingStory = stories.stories.find(story => story.id === pendingStoryId);
    
    if (pendingStory) {
      if (pendingStory.status === "ready") {
        console.log("Story completed, displaying...");
        setPendingStoryId(null);
        handleStoryCreated(pendingStory);
        
        toast({
          title: "Histoire prête",
          description: "Votre histoire personnalisée est maintenant prête à être lue!",
        });
      } else if (pendingStory.status === 'error') {
        console.log("Error in story generation");
        setPendingStoryId(null);
        
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la génération de l'histoire",
          variant: "destructive",
        });
      }
    }
    
    // Refresh story list every 5 seconds if a story is pending
    const interval = setInterval(() => {
      if (pendingStoryId) {
        console.log("Checking story status:", pendingStoryId);
        stories.fetchStories();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [pendingStoryId, stories.stories, handleStoryCreated, toast, stories.fetchStories]);

  // Handler to create a child from the story creation view
  const handleCreateChildFromStory = async (child: Omit<Child, "id">): Promise<string> => {
    try {
      const childId = await handleAddChild(child);
      setCurrentView("create");
      return childId;
    } catch (error) {
      console.error("Error creating child:", error);
      throw error;
    }
  };

  // Specific handler for story submission
  const handleStorySubmitWrapper = async (formData: any): Promise<string> => {
    try {
      const storyId = await handleStorySubmit(formData);
      if (storyId) {
        console.log("Story being created, ID:", storyId);
        setPendingStoryId(storyId);
        setCurrentView("library");
        
        toast({
          title: "Histoire en cours de création",
          description: "Nous préparons votre histoire, vous serez notifié(e) une fois terminée.",
        });
      }
      return storyId;
    } catch (error) {
      console.error("Story creation error:", error);
      throw error;
    }
  };

  // Fonction unique et simplifiée pour la sélection d'histoire
  const handleSelectStory = (story: Story): void => {
    console.log("[useIndexPage] Tentative de sélection d'histoire:", story.id, "status:", story.status);
    
    if (story.status === "ready" || story.status === "read") {
      console.log("[useIndexPage] Histoire valide (ready/read), affichage du lecteur");
      
      // Définir l'histoire comme courante
      setCurrentStory(story);
      
      // Changer immédiatement la vue
      console.log("[useIndexPage] Changement de vue vers 'reader'");
      setCurrentView("reader");
      
      // Si l'histoire est prête (non lue), la marquer comme lue
      if (story.status === "ready") {
        console.log("[useIndexPage] Marquage de l'histoire comme lue");
        handleMarkAsRead(story.id).catch(error => {
          console.error("Erreur lors du marquage de l'histoire comme lue:", error);
        });
      }
      
      // Notification visuelle pour confirmation
      toast({
        title: "Lecture de l'histoire",
        description: `Ouverture de "${story.title}"`,
      });
    } else {
      console.log("[useIndexPage] Histoire non disponible, status:", story.status);
      toast({
        title: "Histoire non disponible",
        description: story.status === "pending" 
          ? "Cette histoire est encore en cours de génération." 
          : "Cette histoire n'est pas disponible pour la lecture.",
        variant: "destructive"
      });
    }
  };

  // Loading state check
  const isLoading = authLoading || !isInitialized || stories.isLoading || childrenLoading;

  return {
    // State
    isInitialized,
    pendingStoryId,
    currentView,
    showGuide,
    currentStory,
    isLoading,
    isMobile,
    user,
    stories,
    children,
    isRetrying,
    
    // Actions
    setCurrentView,
    handleCreateChildFromStory,
    handleStorySubmitWrapper,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    handleSelectStory,
    handleDeleteStory,
    handleRetryStory,
    handleMarkAsRead,
    handleStoryCreated,
    handleCloseReader,
  };
};
