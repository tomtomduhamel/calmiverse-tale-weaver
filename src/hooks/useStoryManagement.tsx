
import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations } from './stories/useStoryMutations';
import { useStoryGeneration } from './stories/useStoryGeneration';
import type { Story, StorySettings } from '@/types/story';

export const useStoryManagement = () => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { deleteStory, retryStoryGeneration, updateStoryStatus } = useStoryMutations();
  const { regenerateStory } = useStoryGeneration();

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
      console.log("[useStoryManagement] DEBUG: Marquage histoire comme lue:", storyId);
      await updateStoryStatus(storyId, 'read');
      
      // Mise à jour de l'histoire courante si c'est celle qui est marquée comme lue
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(prevStory => {
          if (!prevStory) return null;
          return { ...prevStory, status: 'read' };
        });
      }
      
      // Ne pas montrer de toast ici, le feedback est géré dans StoryReader
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
  }, [updateStoryStatus, currentStory, toast]);

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

  // Fonction pour régénérer une histoire avec des paramètres personnalisés
  const handleRegenerateStory = useCallback(async (storyId: string, settings: StorySettings) => {
    try {
      console.log("[useStoryManagement] DEBUG: Demande de régénération d'histoire avec paramètres:", settings);
      
      // Mettre à jour le statut de l'histoire dans la base de données
      await updateStoryStatus(storyId, 'regenerating');
      
      // Si c'est l'histoire courante, mettre à jour son statut localement
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(prevStory => {
          if (!prevStory) return null;
          return { ...prevStory, status: 'regenerating', settings };
        });
      }
      
      // Lancer la régénération via la fonction serverless
      await regenerateStory(storyId, settings);
      
      toast({
        title: "Régénération lancée",
        description: "L'histoire est en cours de régénération avec les nouveaux paramètres",
      });
      
      return true;
    } catch (error: any) {
      console.error("Error regenerating story:", error);
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la régénération",
        variant: "destructive",
      });
      
      // En cas d'erreur, remettre l'histoire à son statut précédent
      if (currentStory && currentStory.id === storyId) {
        await updateStoryStatus(storyId, currentStory.status);
      }
      
      return false;
    }
  }, [updateStoryStatus, currentStory, regenerateStory, toast]);

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
    handleRegenerateStory,
    isRetrying,
    pendingStoryId,
    handleStorySubmit,
    handleStoryCreated,
    handleCloseReader,
    handleSelectStory,
    openStoryReader
  };
};
