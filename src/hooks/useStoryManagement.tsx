
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations } from './stories/useStoryMutations';
import type { Story } from '@/types/story';

export const useStoryManagement = () => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
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
      // Retourne true pour indiquer le succès mais ne montre plus de toast
      // La notification est désormais gérée dans StoryReader
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

  // Fonction simplifiée pour ouvrir directement le lecteur d'histoire
  const openStoryReader = useCallback((story: Story) => {
    console.log("[useStoryManagement] DEBUG: Ouverture directe du lecteur pour l'histoire:", story.id);
    
    // D'abord définir l'histoire courante sans notification
    setCurrentStory(story);
    
    return true;
  }, []);

  // Version simplifiée de la fonction de sélection d'histoire
  const handleSelectStory = useCallback((story: Story) => {
    console.log("[useStoryManagement] DEBUG: Sélection d'histoire directe:", story.id);
    return openStoryReader(story);
  }, [openStoryReader]);

  // Gestion du formulaire de création d'histoire
  const handleStorySubmit = useCallback(async (formData: any) => {
    console.log("Story submission handler", formData);
    return "dummy-story-id";
  }, []);

  const handleStoryCreated = useCallback((story: Story) => {
    console.log("[useStoryManagement] DEBUG: Story created:", story);
    setCurrentStory(story);
  }, []);

  const handleCloseReader = useCallback(() => {
    console.log("[useStoryManagement] DEBUG: Fermeture du lecteur");
    setCurrentStory(null);
  }, []);

  return {
    currentStory,
    setCurrentStory,
    handleDeleteStory,
    handleRetryStory,
    handleMarkAsRead,
    handleToggleFavorite,
    isRetrying,
    pendingStoryId,
    handleStorySubmit,
    handleStoryCreated,
    handleCloseReader,
    handleSelectStory,
    openStoryReader
  };
};
