import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations } from './stories/useStoryMutations';
import type { Story } from '@/types/story';

export const useStoryManagement = () => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  const { deleteStory, retryStoryGeneration, updateStoryStatus } = useStoryMutations();

  const handleDeleteStory = useCallback(async (storyId: string) => {
    try {
      await deleteStory(storyId);
      toast({
        title: "Histoire supprimée",
        description: "L'histoire a été supprimée avec succès",
      });
      return true;
    } catch (error: any) {
      console.error("Error deleting story:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la suppression",
        variant: "destructive",
      });
      return false;
    }
  }, [deleteStory, toast]);

  const handleRetryStory = useCallback(async (storyId: string) => {
    try {
      setIsRetrying(true);
      setPendingStoryId(storyId);
      
      await retryStoryGeneration(storyId);
      
      toast({
        title: "Succès",
        description: "L'histoire est en cours de génération",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error retrying story:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la relance",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsRetrying(false);
      setPendingStoryId(null);
    }
  }, [retryStoryGeneration, toast]);

  const handleMarkAsRead = useCallback(async (storyId: string) => {
    try {
      await updateStoryStatus(storyId, 'read');
      
      toast({
        title: "Histoire marquée comme lue",
        description: "Le statut de l'histoire a été mis à jour",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error marking story as read:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour du statut",
        variant: "destructive",
      });
      return false;
    }
  }, [updateStoryStatus, toast]);

  const handleToggleFavorite = useCallback(async (story: Story) => {
    try {
      // Cette fonction n'est pas encore implémentée
      // Nous devrons ajouter la logique pour marquer une histoire comme favorite
      console.log("Toggle favorite for story:", story.id);
      
      toast({
        title: story.isFavorite ? "Retiré des favoris" : "Ajouté aux favoris",
        description: "Le statut de favori a été mis à jour",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error toggling favorite:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la mise à jour des favoris",
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const handleReadStory = useCallback((story: Story) => {
    if (story.status === "ready") {
      // Mettre à jour le statut de l'histoire comme "lue" lorsque l'utilisateur la lit
      updateStoryStatus(story.id, 'read')
        .then(() => {
          console.log("Story marked as read:", story.id);
        })
        .catch((error) => {
          console.error("Failed to mark story as read:", error);
        });
    }
  }, [updateStoryStatus]);

  return {
    handleDeleteStory,
    handleRetryStory,
    handleMarkAsRead,
    handleToggleFavorite,
    handleReadStory,
    isRetrying,
    pendingStoryId,
  };
};
