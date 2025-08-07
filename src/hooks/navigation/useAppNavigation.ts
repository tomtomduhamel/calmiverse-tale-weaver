import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import type { Story } from '@/types/story';
import type { ViewType } from '@/types/views';

/**
 * Hook centralisé pour toute la navigation de l'application
 * Remplace les multiples hooks de navigation dispersés
 */
export const useAppNavigation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Navigation vers une histoire
  const navigateToStory = useCallback((storyId: string) => {
    console.log('[AppNavigation] Navigation vers l\'histoire:', storyId);
    navigate(`/reader/${storyId}`);
  }, [navigate]);

  // Navigation vers la bibliothèque
  const navigateToLibrary = useCallback((showToast?: { title: string; description: string }) => {
    console.log('[AppNavigation] Navigation vers la bibliothèque');
    
    if (showToast) {
      toast(showToast);
    }
    
    navigate('/library');
  }, [navigate, toast]);

  // Navigation vers la création d'histoire
  const navigateToCreate = useCallback(() => {
    console.log('[AppNavigation] Navigation vers la création');
    navigate('/create-story-titles');
  }, [navigate]);

  // Navigation vers les profils
  const navigateToProfiles = useCallback(() => {
    console.log('[AppNavigation] Navigation vers les profils');
    navigate('/children');
  }, [navigate]);

  // Navigation vers l'accueil
  const navigateToHome = useCallback(() => {
    console.log('[AppNavigation] Navigation vers l\'accueil');
    navigate('/');
  }, [navigate]);

  // Navigation vers les paramètres
  const navigateToSettings = useCallback(() => {
    console.log('[AppNavigation] Navigation vers les paramètres');
    navigate('/settings');
  }, [navigate]);

  // Navigation basée sur ViewType (pour compatibilité)
  const navigateToView = useCallback((view: ViewType) => {
    console.log('[AppNavigation] Navigation vers la vue:', view);
    
    switch (view) {
      case 'home':
        navigateToHome();
        break;
      case 'create':
        navigateToCreate();
        break;
      case 'profiles':
        navigateToProfiles();
        break;
      case 'library':
        navigateToLibrary();
        break;
      case 'settings':
        navigateToSettings();
        break;
    }
  }, [navigateToHome, navigateToCreate, navigateToProfiles, navigateToLibrary, navigateToSettings]);

  // Actions post-création d'histoire
  const handleStoryCreated = useCallback((story: Story) => {
    console.log('[AppNavigation] Histoire créée:', story.id, 'status:', story.status);
    
    if (story.status === 'ready') {
      // L'histoire est prête, naviguer directement vers le lecteur
      navigateToStory(story.id);
    } else {
      // L'histoire est en cours de génération, naviguer vers la bibliothèque avec un message
      navigateToLibrary({
        title: "Histoire en cours de génération",
        description: `"${story.title}" sera disponible dans quelques instants dans votre bibliothèque.`
      });
    }
  }, [navigateToStory, navigateToLibrary]);

  // Actions post-suppression d'histoire
  const handleStoryDeleted = useCallback((storyTitle?: string) => {
    console.log('[AppNavigation] Histoire supprimée:', storyTitle);
    
    // Rester sur la page actuelle et afficher un toast
    toast({
      title: "Histoire supprimée",
      description: storyTitle ? `"${storyTitle}" a été supprimée de votre bibliothèque.` : "L'histoire a été supprimée."
    });
  }, [toast]);

  return {
    // Navigation de base
    navigateToStory,
    navigateToLibrary,
    navigateToCreate,
    navigateToProfiles,
    navigateToHome,
    navigateToSettings,
    navigateToView,
    
    // Actions avec logique métier
    handleStoryCreated,
    handleStoryDeleted
  };
};