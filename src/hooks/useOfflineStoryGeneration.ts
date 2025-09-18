import { useCallback } from 'react';
import { useOfflineSync } from './useOfflineSync';
import { useStoryGenerationManager } from '@/services/stories/StoryGenerationManager';
import { useNotificationCenter } from './useNotificationCenter';

/**
 * Hook qui combine la gestion des générations offline avec le StoryGenerationManager
 * pour fournir une interface unifiée de génération d'histoires
 */
export const useOfflineStoryGeneration = () => {
  const { addToOfflineQueue, isOnline } = useOfflineSync();
  const { generateStoryInBackground } = useStoryGenerationManager();
  const { notifyInfo, notifyWarning } = useNotificationCenter();

  const generateStory = useCallback(async (
    childrenIds: string[],
    childrenNames: string[],
    objective: string
  ): Promise<string> => {
    try {
      if (isOnline) {
        // Si en ligne, utiliser le système de génération normal
        return await generateStoryInBackground({
          childrenIds,
          objective,
          title: 'Histoire personnalisée'
        });
      } else {
        // Si hors ligne, ajouter à la queue offline
        notifyInfo(
          'Mode hors ligne',
          'Votre histoire sera générée dès que la connexion sera rétablie'
        );
        return await addToOfflineQueue(childrenIds, childrenNames, objective);
      }
    } catch (error) {
      console.error('Erreur lors de la génération d\'histoire:', error);
      
      if (!isOnline) {
        // En mode offline, toujours essayer d'ajouter à la queue
        try {
          return await addToOfflineQueue(childrenIds, childrenNames, objective);
        } catch (offlineError) {
          notifyWarning(
            'Erreur de stockage',
            'Impossible de sauvegarder la demande d\'histoire'
          );
          throw offlineError;
        }
      } else {
        throw error;
      }
    }
  }, [isOnline, generateStoryInBackground, addToOfflineQueue, notifyInfo, notifyWarning]);

  return {
    generateStory,
    isOnline
  };
};