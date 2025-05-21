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
    handleMarkAsRead,
    openStoryReader
  } = useStoryManagement();

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not logged in, redirecting to /auth");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);
  
  useEffect(() => {
    console.log("[useIndexPage] DEBUG: Index component mounted, initializing");
    
    try {
      initializeObjectives();
      setIsInitialized(true);
      console.log("[useIndexPage] DEBUG: Index initialization completed successfully");
    } catch (err) {
      console.error("Error during Index initialization:", err);
    }
  }, []);

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
    
    const interval = setInterval(() => {
      if (pendingStoryId) {
        console.log("Checking story status:", pendingStoryId);
        stories.fetchStories();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [pendingStoryId, stories.stories, handleStoryCreated, toast, stories.fetchStories]);

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

  const handleSelectStory = (story: Story) => {
    console.log("[useIndexPage] DEBUG: NOUVELLE FONCTION - Sélection directe d'histoire:", story.id, "status:", story.status);
    
    setCurrentStory(story);
    console.log("[useIndexPage] DEBUG: Histoire courante définie:", story.id);
    
    setTimeout(() => {
      console.log("[useIndexPage] DEBUG: FORÇAGE du changement de vue vers 'reader'");
      setCurrentView("reader");
    }, 50);
    
    if (story.status === "ready") {
      console.log("[useIndexPage] DEBUG: Marquage de l'histoire comme lue");
      handleMarkAsRead(story.id).catch(error => {
        console.error("[useIndexPage] ERROR: Erreur lors du marquage de l'histoire comme lue:", error);
      });
    }
  };

  const isLoading = authLoading || !isInitialized || stories.isLoading || childrenLoading;

  return {
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
    setCurrentStory,
  };
};
