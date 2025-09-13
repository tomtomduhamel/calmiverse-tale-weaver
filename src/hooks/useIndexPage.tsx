
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useSupabaseChildren } from "@/hooks/useSupabaseChildren";
import { useSupabaseStories } from "@/hooks/stories/useSupabaseStories";
import { useViewManagement } from "@/hooks/useViewManagement";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStoriesState } from "@/hooks/stories/useStoriesState";
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

  // Gestion de la soumission d'histoires
  const handleStorySubmitWrapper = async (formData: any): Promise<string> => {
    try {
      setIsRetrying(true);
      const storyId = await stories.createStory(formData, children);
      
      if (storyId) {
        
        setCurrentView("library");
        
        toast({
          title: "Histoire en cours de création",
          description: "Nous préparons votre histoire, vous serez notifié(e) une fois terminée.",
        });
      }
      
      return storyId;
    } catch (error) {
      
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
    handleMarkAsRead,
    clearError
  };
};
