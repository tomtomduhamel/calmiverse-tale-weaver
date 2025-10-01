
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStoriesState } from "@/hooks/stories/useStoriesState";
import { useAuthRedirection } from "@/hooks/app/useAuthRedirection";
import { useToast } from "@/hooks/use-toast";
import { useStoryBackgroundOperations } from "@/hooks/stories/useStoryBackgroundOperations";
import { useNotificationHandlers } from "@/hooks/notifications/useNotificationHandlers";
import { StoryCompletionActions } from "@/services/stories/StoryCompletionActions";
import { useStoryWorkflowToggle } from "@/hooks/stories/useStoryWorkflowToggle";
import type { Child } from "@/types/child";
import { useState, useEffect } from "react";

/**
 * PHASE 2: useIndexPage refactorisé pour utiliser useAppNavigation
 * Plus de useViewManagement - navigation unifiée via React Router
 */
export const useIndexPage = () => {
  const { user } = useSupabaseAuth();
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild } = useSupabaseChildren();
  const stories = useSupabaseStories();
  const { navigateToLibrary, navigateToCreate } = useAppNavigation();
  const isMobile = useIsMobile();
  
  // Guide local state (remplace showGuide de useViewManagement)
  const [showGuide, setShowGuide] = useState<boolean>(false);
  
  useEffect(() => {
    const hideGuide = localStorage.getItem('calmi-hide-guide') === 'true';
    setShowGuide(!hideGuide);
  }, []);
  const { toast } = useToast();
  
  // Phase 6 - Gestion des feature flags et workflow
  const workflow = useStoryWorkflowToggle();
  
  // Hooks pour la Phase 5 - opérations background
  const { handleStoryReady, handleStoryError, saveNotificationToHistory } = useNotificationHandlers();
  
  // Utiliser le nouveau hook pour les opérations background selon le workflow
  const { isSubmitting, createStoryInBackground } = useStoryBackgroundOperations();
  
  // Actions post-génération intégrées
  const completionActions = new StoryCompletionActions({
    onNotification: (title, message, storyId) => {
      saveNotificationToHistory(title, message, 'story_ready', storyId);
      toast({ title, description: message });
    },
    onNavigate: (path) => {
      window.location.href = path;
    },
    onRefresh: () => {
      stories.forceRefresh();
    }
  });
  
  // Gérer l'état des histoires (currentStory supprimé car géré par StoryReaderPage)
  const {
    lastError,
    setLastError,
    isRetrying,
    setIsRetrying,
    clearError
  } = useStoriesState(stories);

  // Redirection automatique pour les utilisateurs non connectés
  useAuthRedirection();

  // Gestion de la création d'enfant depuis l'interface de création d'histoire
  const handleCreateChildFromStory = async (child: Omit<Child, "id">): Promise<string> => {
    try {
      const childId = await handleAddChild(child);
      navigateToCreate();
      return childId;
    } catch (error) {
      
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du profil enfant",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Gestionnaire de soumission d'histoire adaptatif selon le workflow Phase 6
  const handleStorySubmitWrapper = async (formData: any): Promise<string> => {
    try {
      // Log l'action pour analytics
      workflow.logUserAction('story_submission_started', { objective: formData.objective });
      
      const creationMethod = workflow.getStoryCreationMethod();
      console.log("[useIndexPage] Soumission histoire - méthode:", creationMethod, formData);
      
      if (creationMethod === 'background') {
        // Nouveau workflow avec génération en arrière-plan
        const storyId = await createStoryInBackground(formData, (data) => 
          stories.createStory(data, children)
        );
        
        console.log("[useIndexPage] Histoire soumise (background) et génération démarrée:", storyId);
        
        // Navigation immédiate vers la bibliothèque
        navigateToLibrary();
        
        workflow.logUserAction('story_submission_background_success');
        return storyId;
      } else {
        // Ancien workflow avec attente (fallback)
        console.log("[useIndexPage] Utilisation ancien workflow (blocking)");
        const storyId = await stories.createStory(formData, children);
        
        navigateToLibrary();
        workflow.logUserAction('story_submission_blocking_success');
        return storyId;
      }
    } catch (error: any) {
      console.error("[useIndexPage] Erreur soumission:", error);
      
      // Notifier l'erreur selon la méthode de notification
      const notificationMethod = workflow.getNotificationMethod();
      if (notificationMethod === 'native') {
        handleStoryError('unknown', error.message);
      } else {
        // Fallback toast
        toast({
          title: "Erreur",
          description: error.message,
          variant: "destructive"
        });
      }
      
      workflow.logUserAction('story_submission_error', { error: error.message });
      throw error;
    }
  };

  // Gestion de la sélection d'histoires avec navigation appropriée
  const handleSelectStory = (story: any) => {
    // La navigation sera gérée par le composant parent via useAppNavigation
    console.log("[useIndexPage] Histoire sélectionnée:", story.id);
  };

  // Gestionnaires d'événements
  const handleStoryCreated = (story: any) => {
    console.log("[useIndexPage] Histoire créée:", story.id);
    navigateToLibrary();
  };

  const handleMarkAsRead = async (storyId: string): Promise<boolean> => {
    try {
      await stories.updateStoryStatus(storyId, "read");
      return true;
    } catch (error) {
      
      return false;
    }
  };

  const handleDeleteStory = async (storyId: string): Promise<boolean> => {
    try {
      await stories.deleteStory(storyId);
      return true;
    } catch (error) {
      
      return false;
    }
  };

  const handleRetryStory = async (storyId: string): Promise<boolean> => {
    try {
      setIsRetrying(true);
      await stories.retryStoryGeneration(storyId);
      return true;
    } catch (error) {
      
      return false;
    } finally {
      setIsRetrying(false);
    }
  };

  // État de chargement global
  const isLoading = stories.isLoading;

  return {
    // États
    showGuide,
    pendingStoryId: stories.pendingStoryId,
    isRetrying: isSubmitting, // Utiliser le nouveau état de soumission
    isLoading,
    stories,
    children,
    user,
    isMobile,
    lastError,
    
    // Phase 6 - Workflow et feature flags
    workflow,
    
    // Actions
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
    handleStorySubmitWrapper,
    handleCreateChildFromStory,
    handleStoryCreated,
    handleSelectStory,
    handleDeleteStory,
    handleRetryStory,
    handleMarkAsRead,
    clearError
  };
};
