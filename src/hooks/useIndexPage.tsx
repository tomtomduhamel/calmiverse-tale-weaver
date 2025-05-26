
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useViewManagement } from "@/hooks/useViewManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStoriesState } from "@/hooks/stories/useStoriesState";
import { useStoryFromUrl } from "@/hooks/useStoryFromUrl";
import { useAuthRedirection } from "@/hooks/app/useAuthRedirection";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";

export const useIndexPage = () => {
  const { user } = useSupabaseAuth();
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild } = useSupabaseChildren();
  const stories = useSupabaseStories();
  const { currentView, setCurrentView, showGuide } = useViewManagement();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Gérer l'état des histoires
  const {
    currentStory,
    setCurrentStory,
    lastError,
    setLastError,
    isRetrying,
    setIsRetrying,
    clearError
  } = useStoriesState(stories);

  // Hook pour charger une histoire depuis l'URL
  const { isLoadingFromUrl } = useStoryFromUrl({
    stories: stories.stories || [],
    setCurrentStory
  });

  // Redirection automatique pour les utilisateurs non connectés
  useAuthRedirection();

  // Gestion de la création d'enfant depuis l'interface de création d'histoire
  const handleCreateChildFromStory = async (child: Omit<Child, "id">): Promise<string> => {
    try {
      const childId = await handleAddChild(child);
      setCurrentView("create");
      return childId;
    } catch (error) {
      console.error("Error creating child:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du profil enfant",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Gestion de la soumission d'histoires
  const handleStorySubmitWrapper = async (formData: any): Promise<string> => {
    try {
      setIsRetrying(true);
      const storyId = await stories.createStory(formData, children);
      
      if (storyId) {
        console.log("Story being created, ID:", storyId);
        setCurrentView("library");
        
        toast({
          title: "Histoire en cours de création",
          description: "Nous préparons votre histoire, vous serez notifié(e) une fois terminée.",
        });
      }
      
      return storyId;
    } catch (error) {
      console.error("Story creation error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsRetrying(false);
    }
  };

  // Gestion de la sélection d'histoires
  const handleSelectStory = (story: any) => {
    console.log("[useIndexPage] DEBUG: Sélection d'histoire:", story.id, "status:", story.status);
    
    // Définir l'histoire courante IMMÉDIATEMENT
    setCurrentStory(story);
    console.log("[useIndexPage] DEBUG: Histoire courante définie:", story.id);
    
    // Changer la vue vers reader avec l'ID de l'histoire
    console.log("[useIndexPage] DEBUG: Changement de vue vers 'reader' avec storyId:", story.id);
    setCurrentView("reader", story.id);
    
    // Marquer l'histoire comme lue si nécessaire (en arrière-plan)
    if (story.status === "ready") {
      console.log("[useIndexPage] DEBUG: Marquage de l'histoire comme lue en arrière-plan");
      handleMarkAsRead(story.id).catch(error => {
        console.error("[useIndexPage] ERROR: Erreur lors du marquage de l'histoire comme lue:", error);
      });
    }
  };

  // Gestionnaires d'événements
  const handleStoryCreated = (story: any) => {
    console.log("[useIndexPage] Histoire créée:", story.id);
    setCurrentStory(story);
    setCurrentView("reader", story.id);
  };

  const handleCloseReader = () => {
    console.log("[useIndexPage] Fermeture du lecteur");
    setCurrentStory(null);
    setCurrentView("library");
  };

  const handleMarkAsRead = async (storyId: string): Promise<boolean> => {
    try {
      await stories.updateStoryStatus(storyId, "read");
      
      // Mettre à jour l'histoire actuelle si c'est celle qui vient d'être marquée comme lue
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory({
          ...currentStory,
          status: "read"
        });
      }
      
      return true;
    } catch (error) {
      console.error("[useIndexPage] Erreur lors du marquage comme lu:", error);
      return false;
    }
  };

  const handleDeleteStory = async (storyId: string): Promise<boolean> => {
    try {
      await stories.deleteStory(storyId);
      
      // Si l'histoire supprimée était celle en cours de lecture, fermer le lecteur
      if (currentStory && currentStory.id === storyId) {
        handleCloseReader();
      }
      
      return true;
    } catch (error) {
      console.error("[useIndexPage] Erreur lors de la suppression:", error);
      return false;
    }
  };

  const handleRetryStory = async (storyId: string): Promise<boolean> => {
    try {
      setIsRetrying(true);
      await stories.retryStoryGeneration(storyId);
      return true;
    } catch (error) {
      console.error("[useIndexPage] Erreur lors de la relance:", error);
      return false;
    } finally {
      setIsRetrying(false);
    }
  };

  // État de chargement global
  const isLoading = stories.isLoading || isLoadingFromUrl;

  return {
    // États
    currentView,
    showGuide,
    currentStory,
    pendingStoryId: stories.pendingStoryId,
    isRetrying,
    isLoading,
    stories,
    children,
    user,
    isMobile,
    lastError,
    
    // Actions
    setCurrentView,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    handleStorySubmitWrapper,
    handleCreateChildFromStory,
    handleStoryCreated,
    handleSelectStory,
    handleDeleteStory,
    handleRetryStory,
    handleCloseReader,
    handleMarkAsRead,
    clearError
  };
};
