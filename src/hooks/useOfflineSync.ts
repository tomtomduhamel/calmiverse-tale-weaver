import { useState, useEffect, useCallback } from 'react';
import { offlineStoryQueue, OfflineStoryGeneration } from '@/services/OfflineStoryQueue';
import { NotificationPersistence } from '@/services/NotificationPersistence';
import { useNotificationCenter } from '@/hooks/useNotificationCenter';

interface OfflineSyncState {
  isOnline: boolean;
  queueSize: number;
  pendingGenerations: number;
  processingGenerations: number;
  syncInProgress: boolean;
  lastSyncAttempt: number | null;
}

export const useOfflineSync = () => {
  const { notifyInfo, notifySuccess, notifyWarning } = useNotificationCenter();
  const [notificationPersistence] = useState(() => new NotificationPersistence());
  
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: navigator.onLine,
    queueSize: 0,
    pendingGenerations: 0,
    processingGenerations: 0,
    syncInProgress: false,
    lastSyncAttempt: null
  });

  // Mettre à jour l'état de la queue
  const updateQueueState = useCallback(() => {
    const pending = offlineStoryQueue.getPendingGenerations().length;
    const processing = offlineStoryQueue.getProcessingGenerations().length;
    
    setState(prev => ({
      ...prev,
      queueSize: pending + processing,
      pendingGenerations: pending,
      processingGenerations: processing
    }));
  }, []);

  // Ajouter une génération à la queue offline
  const addToOfflineQueue = useCallback(async (
    childrenIds: string[],
    childrenNames: string[],
    objective: string
  ): Promise<string> => {
    try {
      const generationId = await offlineStoryQueue.addToQueue({
        childrenIds,
        childrenNames,
        objective
      });

      if (!navigator.onLine) {
        notifyInfo(
          'Mode hors ligne',
          'Votre histoire sera générée dès que la connexion sera rétablie'
        );
        
        // Persister la notification
        await notificationPersistence.addNotification({
          id: crypto.randomUUID(),
          title: 'Histoire en attente',
          body: `Histoire pour ${childrenNames.join(', ')} ajoutée à la file d'attente`,
          type: 'general',
          timestamp: Date.now(),
          read: false
        });
      } else {
        notifyInfo(
          'Génération en cours',
          'Votre histoire est en cours de génération...'
        );
      }

      return generationId;
    } catch (error) {
      console.error('Erreur lors de l\'ajout à la queue offline:', error);
      throw error;
    }
  }, [notifyInfo, notificationPersistence]);

  // Forcer la synchronisation
  const forceSync = useCallback(async (): Promise<void> => {
    if (!navigator.onLine) {
      notifyWarning(
        'Pas de connexion',
        'Impossible de synchroniser sans connexion internet'
      );
      return;
    }

    setState(prev => ({ ...prev, syncInProgress: true, lastSyncAttempt: Date.now() }));
    
    try {
      await offlineStoryQueue.processQueue();
      notifySuccess(
        'Synchronisation terminée',
        'Toutes les histoires en attente ont été traitées'
      );
    } catch (error) {
      console.error('Erreur lors de la synchronisation forcée:', error);
      notifyWarning(
        'Erreur de synchronisation',
        'Une erreur est survenue lors de la synchronisation'
      );
    } finally {
      setState(prev => ({ ...prev, syncInProgress: false }));
    }
  }, [notifyWarning, notifySuccess]);

  // Obtenir les générations en cours
  const getQueuedGenerations = useCallback((): OfflineStoryGeneration[] => {
    return offlineStoryQueue.getQueue();
  }, []);

  // Supprimer une génération de la queue
  const removeFromQueue = useCallback(async (generationId: string): Promise<void> => {
    await offlineStoryQueue.removeFromQueue(generationId);
    updateQueueState();
  }, [updateQueueState]);

  // Effacer toute la queue
  const clearOfflineQueue = useCallback(async (): Promise<void> => {
    await offlineStoryQueue.clearQueue();
    updateQueueState();
    notifyInfo('Queue vidée', 'Toutes les générations en attente ont été supprimées');
  }, [updateQueueState, notifyInfo]);

  // Écouter les changements de connexion
  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      
      // Notifier le retour de connexion s'il y a des éléments en queue
      if (offlineStoryQueue.getQueueSize() > 0) {
        notifySuccess(
          'Connexion rétablie',
          'Synchronisation des histoires en cours...'
        );
      }
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      notifyWarning(
        'Mode hors ligne',
        'Les nouvelles histoires seront mises en file d\'attente'
      );
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [notifySuccess, notifyWarning]);

  // Écouter les mises à jour de la queue
  useEffect(() => {
    const unsubscribe = offlineStoryQueue.subscribeToUpdates((queueInfo) => {
      setState(prev => ({
        ...prev,
        queueSize: queueInfo.queueSize,
        pendingGenerations: queueInfo.pending,
        processingGenerations: queueInfo.processing
      }));
    });

    // État initial
    updateQueueState();

    return unsubscribe;
  }, [updateQueueState]);

  // Écouter les générations terminées
  useEffect(() => {
    const handleGenerationCompleted = (event: CustomEvent) => {
      const { story } = event.detail;
      notifySuccess(
        'Histoire générée !',
        `"${story.title}" est maintenant disponible`
      );
    };

    window.addEventListener('story-generation-completed', handleGenerationCompleted as EventListener);

    return () => {
      window.removeEventListener('story-generation-completed', handleGenerationCompleted as EventListener);
    };
  }, [notifySuccess]);

  return {
    // État
    ...state,
    
    // Actions
    addToOfflineQueue,
    forceSync,
    removeFromQueue,
    clearOfflineQueue,
    getQueuedGenerations,
    
    // Helpers
    hasQueuedItems: state.queueSize > 0,
    canSync: state.isOnline && !state.syncInProgress,
    needsSync: state.isOnline && state.queueSize > 0
  };
};