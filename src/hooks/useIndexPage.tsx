
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useViewManagement } from "@/hooks/useViewManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStoriesState } from "@/hooks/stories/useStoriesState";
import { useAuthRedirection } from "@/hooks/app/useAuthRedirection";
import { useToast } from "@/hooks/use-toast";
import { useNonBlockingStorySubmission } from "@/hooks/stories/useNonBlockingStorySubmission";
import { useBackgroundStoryGeneration } from "@/hooks/stories/useBackgroundStoryGeneration";
import { useNotificationHandlers } from "@/hooks/notifications/useNotificationHandlers";
import { StoryCompletionActions } from "@/services/stories/StoryCompletionActions";
import type { Child } from "@/types/child";

export const useIndexPage = () => {
  const { user } = useSupabaseAuth();
  const { children, handleAddChild, handleUpdateChild, handleDeleteChild } = useSupabaseChildren();
  const stories = useSupabaseStories();
  const { currentView, setCurrentView, showGuide } = useViewManagement();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  
  // Nouveaux hooks pour la Phase 3
  const { startGeneration } = useBackgroundStoryGeneration();
  const { handleStoryReady, handleStoryError, saveNotificationToHistory } = useNotificationHandlers();
  
  const { submitStory, isSubmitting } = useNonBlockingStorySubmission({
    onSubmit: async (formData) => {
      // Utiliser la logique existante de création d'histoire
      const storyId = await stories.createStory(formData, children);
      
      // Démarrer le suivi en arrière-plan
      startGeneration(storyId, 'Nouvelle histoire en cours...');
      
      return storyId;
    },
    onSuccess: (storyId) => {
      setCurrentView('library');
    }
  });
  
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
      setCurrentView("create");
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

  // Gestionnaire de soumission d'histoire amélioré avec nouveau workflow
  const handleStorySubmitWrapper = async (formData: any): Promise<string> => {
    try {
      console.log("[useIndexPage] Soumission histoire avec nouveau workflow:", formData);
      
      // Utiliser le système non-bloquant de Phase 3
      const storyId = await submitStory(formData);
      
      console.log("[useIndexPage] Histoire soumise avec succès:", storyId);
      
      return storyId;
    } catch (error: any) {
      console.error("[useIndexPage] Erreur soumission:", error);
      
      // Notifier l'erreur via le système de notifications
      handleStoryError('unknown', error.message);
      
      // Relancer l'erreur pour que le composant parent puisse la gérer
      throw error;
    }
  };

  // Gestion de la sélection d'histoires avec navigation appropriée
  const handleSelectStory = (story: any) => {
    
    // Utiliser React Router pour une navigation SPA fluide
    setCurrentView('library'); // Préserver l'état de vue actuel
    // La navigation sera gérée par le composant parent via useAppNavigation
  };

  // Gestionnaires d'événements
  const handleStoryCreated = (story: any) => {
    
    setCurrentView("library");
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
    currentView,
    showGuide,
    pendingStoryId: stories.pendingStoryId,
    isRetrying: isSubmitting, // Utiliser le nouveau état de soumission
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
    handleMarkAsRead,
    clearError
  };
};
