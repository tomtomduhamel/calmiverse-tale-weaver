
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useViewManagement } from '@/hooks/useViewManagement';
import { useToast } from '@/hooks/use-toast';
import type { Story } from '@/types/story';

interface StoryRedirectionOptions {
  redirectDelay?: number;
  showSuccessToast?: boolean;
}

export const useStoryRedirection = (options: StoryRedirectionOptions = {}) => {
  const navigate = useNavigate();
  const { setCurrentView } = useViewManagement();
  const { toast } = useToast();
  
  const {
    redirectDelay = 1000, // 1 seconde de délai par défaut
    showSuccessToast = true
  } = options;

  const redirectToLibrary = useCallback((story?: Story, reason?: string) => {
    console.log('[StoryRedirection] Redirection vers la bibliothèque:', { story: story?.id, reason });
    
    if (showSuccessToast && story) {
      toast({
        title: "Histoire prête !",
        description: `"${story.title}" a été ajoutée à votre bibliothèque`,
      });
    }
    
    // Délai pour permettre à l'utilisateur de voir le message de succès
    setTimeout(() => {
      // Utiliser navigate pour la redirection
      navigate('/library');
      setCurrentView('library');
      
      console.log('[StoryRedirection] Redirection effectuée vers /library');
    }, redirectDelay);
  }, [navigate, setCurrentView, toast, showSuccessToast, redirectDelay]);

  const redirectToHome = useCallback(() => {
    console.log('[StoryRedirection] Redirection vers l\'accueil');
    navigate('/');
    setCurrentView('home');
  }, [navigate, setCurrentView]);

  return {
    redirectToLibrary,
    redirectToHome
  };
};
