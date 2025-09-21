import { useState, useCallback } from 'react';
import { useBackgroundStoryGeneration } from '@/hooks/stories/useBackgroundStoryGeneration';
import { useNotificationHandlers } from '@/hooks/notifications/useNotificationHandlers';
import { useToast } from '@/hooks/use-toast';
import { StoryGenerationQueue } from '@/services/stories/StoryGenerationQueue';
interface StoryFormData {
  childrenIds: string[];
  objective: string;
}

/**
 * Hook centralisé pour les opérations en arrière-plan des histoires
 * Remplace la logique d'attente par un système de génération background
 */
export const useStoryBackgroundOperations = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { startGeneration } = useBackgroundStoryGeneration();
  const { handleStoryReady, handleStoryError, saveNotificationToHistory } = useNotificationHandlers();
  const { toast } = useToast();

  /**
   * Crée une histoire et démarre la génération en arrière-plan
   */
  const createStoryInBackground = useCallback(async (
    formData: StoryFormData,
    createStoryFn: (data: StoryFormData) => Promise<string>
  ): Promise<string> => {
    try {
      setIsSubmitting(true);

      // Créer l'histoire dans la base de données
      const storyId = await createStoryFn(formData);

      // Ajouter à la queue de génération
      const queue = StoryGenerationQueue.getInstance();
      await queue.addToQueue({
        id: storyId,
        userId: 'user', // Sera récupéré du contexte auth
        objective: formData.objective,
        childrenIds: formData.childrenIds,
        status: 'pending',
        createdAt: new Date()
      });

      // Démarrer le suivi en arrière-plan
      await startGeneration(storyId, 'Nouvelle histoire en cours de génération...');

      // Sauvegarder la notification dans l'historique
      saveNotificationToHistory(
        'Histoire en cours',
        'Votre histoire est en cours de génération',
        'story_ready',
        storyId
      );

      // Toast de confirmation
      toast({
        title: "Histoire lancée",
        description: "Votre histoire est en cours de génération. Vous serez notifié quand elle sera prête.",
      });

      return storyId;
    } catch (error: any) {
      console.error('[useStoryBackgroundOperations] Erreur création:', error);
      
      // Gérer l'erreur via le système de notifications
      handleStoryError('unknown', error.message);
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [startGeneration, handleStoryError, saveNotificationToHistory, toast]);

  /**
   * Relance une histoire en erreur en arrière-plan
   */
  const retryStoryInBackground = useCallback(async (
    storyId: string,
    retryStoryFn: (id: string) => Promise<void>
  ): Promise<void> => {
    try {
      setIsSubmitting(true);

      // Relancer la génération
      await retryStoryFn(storyId);

      // Redémarrer le suivi en arrière-plan
      await startGeneration(storyId, 'Nouvelle tentative de génération...');

      toast({
        title: "Génération relancée",
        description: "Une nouvelle tentative de génération a été lancée.",
      });
    } catch (error: any) {
      console.error('[useStoryBackgroundOperations] Erreur relance:', error);
      
      handleStoryError(storyId, error.message);
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [startGeneration, handleStoryError, toast]);

  /**
   * Obtient les histoires en cours de génération
   */
  const getStoriesInProgress = useCallback(() => {
    const queue = StoryGenerationQueue.getInstance();
    return queue.getProcessingStories();
  }, []);

  /**
   * Obtient le nombre d'histoires en cours
   */
  const getInProgressCount = useCallback(() => {
    const queue = StoryGenerationQueue.getInstance();
    return queue.getQueueSize();
  }, []);

  return {
    isSubmitting,
    createStoryInBackground,
    retryStoryInBackground,
    getStoriesInProgress,
    getInProgressCount
  };
};