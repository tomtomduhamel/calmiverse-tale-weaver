import { useCallback, useState } from 'react';
import { useStoryDeletion } from '@/hooks/stories/useStoryDeletion';
import type { Story } from '@/types/story';

interface UseStoryReaderActionsProps {
  story: Story | null;
  setStory: (story: Story | null) => void;
  setIsUpdatingFavorite: (updating: boolean) => void;
  onBack?: () => void;
  onClose?: () => void;
  onToggleFavorite?: (storyId: string) => void;
  stopAutoScroll: () => void;
}

export const useStoryReaderActions = ({
  story,
  setStory,
  setIsUpdatingFavorite,
  onBack,
  onClose,
  onToggleFavorite,
  stopAutoScroll
}: UseStoryReaderActionsProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteStory } = useStoryDeletion();
  
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

  // Gestion du toggle favori
  const handleToggleFavorite = useCallback(async (storyId: string, currentFavoriteStatus: boolean) => {
    if (!onToggleFavorite) return;
    
    console.log("[StoryReaderActions] DEBUG: Toggle favori appelé pour:", storyId, "statut actuel:", currentFavoriteStatus);
    
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

  // Gestion de la suppression
  const handleDelete = useCallback(async () => {
    if (!story || isDeleting) return;
    
    console.log("[StoryReaderActions] DEBUG: Suppression demandée pour:", story.id);
    
    setIsDeleting(true);
    try {
      const success = await deleteStory(story.id);
      if (success) {
        console.log("[StoryReaderActions] SUCCESS: Histoire supprimée, retour arrière");
        handleBack(); // Retour à la bibliothèque
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'histoire:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [story, deleteStory, isDeleting, handleBack]);

  return {
    handleBack,
    handleToggleFavorite,
    handleDelete,
    isDeleting
  };
};
