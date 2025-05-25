
import { useIsMobile } from "@/hooks/use-mobile";
import { useStories } from "@/hooks/useStories";
import { useStoryManagement } from "@/hooks/useStoryManagement";
import { useViewManagement } from "@/hooks/useViewManagement";
import { useAuthRedirection, useAppInitialization } from "@/hooks/app";
import { useChildManagement } from "@/hooks/stories/useChildManagement";
import { useStorySubmission } from "@/hooks/stories/useStorySubmission";
import { useStorySelection } from "@/hooks/stories/useStorySelection";
import { usePendingStoryMonitor } from "@/hooks/stories/monitoring/usePendingStoryMonitor";
import type { Story } from "@/types/story";

/**
 * Hook principal pour la page d'index, orchestrant les différents hooks spécialisés
 */
export const useIndexPage = () => {
  // Hooks d'authentification et d'initialisation
  const { user, authLoading, isAuthenticated } = useAuthRedirection();
  const { isInitialized } = useAppInitialization();
  
  // Hooks de gestion des vues et de l'affichage
  const { 
    currentView, 
    setCurrentView, 
    showGuide 
  } = useViewManagement();
  const isMobile = useIsMobile();
  
  // Hooks de gestion des enfants et des histoires
  const { 
    children, 
    childrenLoading, 
    handleAddChild, 
    handleUpdateChild, 
    handleDeleteChild, 
    handleCreateChildFromStory 
  } = useChildManagement(setCurrentView);
  
  // Debug: Log détaillé des enfants dans useIndexPage
  console.log('[useIndexPage] État des enfants:', {
    children: children,
    childrenCount: children?.length || 0,
    childrenLoading,
    childrenData: children?.map(c => ({ id: c.id, name: c.name })) || [],
    user: user?.id,
    timestamp: new Date().toISOString()
  });
  
  const { 
    stories, 
    currentStory, 
    setCurrentStory, 
    deleteStory, 
    retryFailedStory, 
    isRetrying 
  } = useStories(children);
  
  const {
    handleStorySubmit,
    handleCloseReader,
    handleDeleteStory,
    handleRetryStory,
    handleMarkAsRead,
  } = useStoryManagement();
  
  // Hooks de monitoring et de soumission d'histoires
  const { pendingStoryId, setPendingStoryId } = usePendingStoryMonitor({
    stories: stories.stories,
    fetchStories: stories.fetchStories,
    onStoryCompleted: (story: Story) => setCurrentStory(story)
  });
  
  const { handleStorySubmitWrapper } = useStorySubmission(
    handleStorySubmit, 
    setCurrentView,
    setPendingStoryId
  );
  
  // Hook de sélection d'histoires
  const { handleSelectStory } = useStorySelection({
    setCurrentStory,
    setCurrentView,
    handleMarkAsRead
  });
  
  // État de chargement global
  const isLoading = authLoading || !isInitialized || stories.isLoading || childrenLoading;
  
  // Interface unifiée pour les composants
  return {
    // États
    isInitialized,
    pendingStoryId,
    currentView,
    showGuide,
    currentStory,
    isLoading,
    isMobile,
    user,
    stories,
    children: children || [], // S'assurer que children est toujours un tableau défini
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
    handleStoryCreated: setCurrentStory,
    handleCloseReader,
    setCurrentStory,
  };
};
