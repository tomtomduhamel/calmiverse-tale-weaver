import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryMutations } from './stories/useStoryMutations';
import { useStoryGeneration } from './stories/useStoryGeneration';
import { useStoryRecovery } from './stories/monitoring/useStoryRecovery';
import type { Story, StorySettings } from '@/types/story';

export const useStoryManagement = () => {
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { deleteStory, retryStoryGeneration, updateStoryStatus } = useStoryMutations();
  const { regenerateStory } = useStoryGeneration();
  const { recoverStuckStory } = useStoryRecovery();

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
      
      // Utiliser le nouveau système de récupération
      const story = { id: storyId, title: "Histoire en récupération" } as Story;
      const success = await recoverStuckStory(story);
      
      if (success) {
        toast({
          title: "Succès",
          description: "L'histoire est en cours de génération avec surveillance améliorée",
        });
      }
      
      return success;
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
  }, [recoverStuckStory, toast]);

  const handleMarkAsRead = useCallback(async (storyId: string): Promise<boolean> => {
    try {
      console.log("[useStoryManagement] DEBUG: Marquage histoire comme lue:", storyId);
      await updateStoryStatus(storyId, 'read');
      
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(prevStory => {
          if (!prevStory) return null;
          return { ...prevStory, status: 'read' };
        });
      }
      
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

  const handleRegenerateStory = useCallback(async (storyId: string, settings: StorySettings) => {
    try {
      console.log("[useStoryManagement] DEBUG: Demande de régénération d'histoire avec paramètres:", settings);
      
      await updateStoryStatus(storyId, 'regenerating' as any);
      
      if (currentStory && currentStory.id === storyId) {
        setCurrentStory(prevStory => {
          if (!prevStory) return null;
          return { ...prevStory, status: 'regenerating' as any, settings };
        });
      }
      
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
      
      if (currentStory && currentStory.id === storyId) {
        await updateStoryStatus(storyId, currentStory.status as any);
      }
      
      return false;
    }
  }, [updateStoryStatus, currentStory, regenerateStory, toast]);

  const openStoryReader = useCallback((story: Story) => {
    console.log("[useStoryManagement] DEBUG: Ouverture directe du lecteur pour l'histoire:", story.id);
    setCurrentStory(story);
    return true;
  }, []);

  const handleSelectStory = useCallback((story: Story) => {
    console.log("[useStoryManagement] DEBUG: Sélection d'histoire directe:", story.id);
    return openStoryReader(story);
  }, [openStoryReader]);

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
