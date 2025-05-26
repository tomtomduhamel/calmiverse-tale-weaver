
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useViewManagement } from "@/hooks/useViewManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import { useChildManagement, useStorySubmission, useStorySelection } from "@/hooks/stories";
import { useStoriesState } from "@/hooks/stories/useStoriesState";
import { useStoryFromUrl } from "@/hooks/useStoryFromUrl";
import { useAuthRedirection } from "@/hooks/app/useAuthRedirection";

export const useIndexPage = () => {
  const { user } = useSupabaseAuth();
  const { children, addChild, updateChild, deleteChild } = useSupabaseChildren();
  const stories = useSupabaseStories();
  const { currentView, setCurrentView, showGuide } = useViewManagement();
  const isMobile = useIsMobile();
  
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

  // Gestion des enfants
  const { handleAddChild, handleUpdateChild, handleDeleteChild } = useChildManagement({
    addChild,
    updateChild,
    deleteChild
  });

  // Gestion de la soumission d'histoires
  const { 
    handleStorySubmitWrapper, 
    handleCreateChildFromStory,
    pendingStoryId
  } = useStorySubmission({
    createStory: stories.createStory,
    addChild,
    setLastError,
    setIsRetrying
  });

  // Gestion de la sélection d'histoires
  const { handleSelectStory } = useStorySelection({
    setCurrentStory,
    setCurrentView,
    handleMarkAsRead: stories.updateStoryStatus
  });

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
      await stories.retryFailedStory(storyId);
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
    pendingStoryId,
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
