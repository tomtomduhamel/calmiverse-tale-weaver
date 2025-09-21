
import { useState, useCallback } from 'react';
import { useBackgroundStoryGeneration } from './useBackgroundStoryGeneration';
import { useNotificationHandlers } from '@/hooks/notifications/useNotificationHandlers';
import { useToast } from '@/hooks/use-toast';
import { StoryGenerationQueue } from '@/services/stories/StoryGenerationQueue';

interface StoryCreationMonitorOptions {
  onStoryCreated?: (storyId: string) => void;
  onTimeout?: () => void;
}

/**
 * Hook refactorisé pour le mode background
 * Ne fait plus de polling actif mais s'appuie sur le système de notifications
 */
export const useStoryCreationMonitor = (options: StoryCreationMonitorOptions = {}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const { startGeneration } = useBackgroundStoryGeneration();
  const { handleStoryReady, handleStoryError } = useNotificationHandlers();
  const { toast } = useToast();
  
  const { onStoryCreated, onTimeout } = options;

  /**
   * Démarre le monitoring en mode background
   * Plus de polling actif, utilise le système de notifications
   */
  const startMonitoring = useCallback(async (storyId: string) => {
    console.log('[StoryCreationMonitor] Démarrage surveillance background:', storyId);
    setIsMonitoring(true);
    
    try {
      // Démarrer la génération en arrière-plan
      await startGeneration(storyId, 'Surveillance de la génération...');
      
      // Le système de notifications gérera le reste
      console.log('[StoryCreationMonitor] Surveillance déléguée au système background');
      
    } catch (error) {
      console.error('[StoryCreationMonitor] Erreur démarrage surveillance:', error);
      setIsMonitoring(false);
      
      if (onTimeout) {
        onTimeout();
      }
    }
  }, [startGeneration, onTimeout]);

  /**
   * Arrête le monitoring
   */
  const stopMonitoring = useCallback(() => {
    console.log('[StoryCreationMonitor] Arrêt surveillance');
    setIsMonitoring(false);
  }, []);

  /**
   * Gestionnaire de notification de succès
   */
  const handleStoryCompleted = useCallback((storyId: string) => {
    console.log('[StoryCreationMonitor] Histoire complétée:', storyId);
    setIsMonitoring(false);
    
    toast({
      title: "Histoire créée",
      description: "Votre histoire est maintenant disponible dans votre bibliothèque",
    });
    
    if (onStoryCreated) {
      onStoryCreated(storyId);
    }
  }, [toast, onStoryCreated]);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    handleStoryCompleted
  };
};
