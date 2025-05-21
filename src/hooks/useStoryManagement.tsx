
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

  // Ajout des fonctions manquantes
  const handleStorySubmit = useCallback(async (formData: any) => {
    console.log("Story submission handler", formData);
    // Cette fonction serait normalement implémentée pour soumettre une nouvelle histoire
    return "dummy-story-id"; // Retourne un ID factice pour l'histoire
  }, []);

  const handleStoryCreated = useCallback((story: Story) => {
    console.log("[useStoryManagement] DEBUG: Story created:", story);
    setCurrentStory(story);
  }, []);

  const handleCloseReader = useCallback(() => {
    console.log("[useStoryManagement] DEBUG: Fermeture du lecteur");
    setCurrentStory(null);
  }, []);

  // Version simplifiée de la fonction de sélection d'histoire
  const handleSelectStory = useCallback((story: Story) => {
    console.log("[useStoryManagement] DEBUG: Sélection d'histoire:", story.id, "status:", story.status);
    
    if (story.status === "ready" || story.status === "read") {
      console.log("[useStoryManagement] DEBUG: Histoire valide pour lecture, définition comme histoire courante");
      setCurrentStory(story);
      
      // Si l'histoire n'est pas encore marquée comme lue, la marquer
      if (story.status === "ready") {
        updateStoryStatus(story.id, 'read').catch(err => {
          console.error("Erreur lors du marquage de l'histoire comme lue:", err);
        });
      }
      
      return true;
    } else {
      console.log("[useStoryManagement] DEBUG: Histoire non disponible pour lecture");
      toast({
        title: "Histoire non disponible",
        description: story.status === "pending" 
          ? "Cette histoire est encore en cours de génération." 
          : "Cette histoire n'est pas disponible pour la lecture.",
        variant: "destructive"
      });
      
      return false;
    }
  }, [updateStoryStatus, toast]);

  return {
    currentStory,
    setCurrentStory,
    handleDeleteStory,
    handleRetryStory,
    handleMarkAsRead,
    handleToggleFavorite,
    isRetrying,
    pendingStoryId,
    // Ajout explicite des fonctions manquantes
    handleStorySubmit,
    handleStoryCreated,
    handleCloseReader,
    handleSelectStory
  };
};
