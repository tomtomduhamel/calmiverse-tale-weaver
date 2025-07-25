
import { useCallback } from 'react';
import type { Story } from '@/types/story';

interface UseStoryReaderActionsProps {
  story: Story | null;
  setStory: (story: Story | null) => void;
  setIsUpdatingFavorite: (updating: boolean) => void;
  setShowReadingGuide: (show: boolean) => void;
  onBack?: () => void;
  onClose?: () => void;
  onToggleFavorite?: (storyId: string) => void;
  stopAutoScroll: () => void;
}

export const useStoryReaderActions = ({
  story,
  setStory,
  setIsUpdatingFavorite,
  setShowReadingGuide,
  onBack,
  onClose,
  onToggleFavorite,
  stopAutoScroll
}: UseStoryReaderActionsProps) => {
  
  // Gestion de la fermeture
  const handleBack = useCallback(() => {
    console.log("[StoryReader] DEBUG: Bouton Fermer cliqué");
    stopAutoScroll();
    if (onBack) {
      onBack();
    } else if (onClose) {
      onClose();
    }
  }, [onBack, onClose, stopAutoScroll]);

  // Gestion des paramètres
  const handleSettingsClick = useCallback(() => {
    setShowReadingGuide(true);
  }, [setShowReadingGuide]);

  // Gestion du toggle favori
  const handleToggleFavorite = useCallback(async (storyId: string, currentFavoriteStatus: boolean) => {
    if (!onToggleFavorite) return;
    
    setIsUpdatingFavorite(true);
    try {
      await onToggleFavorite(storyId);
      // Mettre à jour l'état local
      if (story && story.id === storyId) {
        setStory({
          ...story,
          isFavorite: !currentFavoriteStatus
        });
      }
    } catch (error) {
      console.error("Erreur lors du toggle favori:", error);
    } finally {
      setIsUpdatingFavorite(false);
    }
  }, [onToggleFavorite, story, setStory, setIsUpdatingFavorite]);

  return {
    handleBack,
    handleSettingsClick,
    handleToggleFavorite
  };
};
