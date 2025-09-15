import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notifications/NotificationService';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isLoading: boolean;
}

/**
 * Hook pour gérer les notifications PWA natives
 * Utilise le NotificationService centralisé
 */
export const useNativePWANotifications = () => {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    isSupported: false,
    isLoading: true
  });

  // Vérifier le support des notifications
  useEffect(() => {
    const checkSupport = () => {
      const isSupported = notificationService.isSupported();
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission: notificationService.getPermission(),
        isLoading: false
      }));
    };

    checkSupport();
  }, []);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    const granted = await notificationService.requestPermission();
    
    setState(prev => ({
      ...prev,
      permission: notificationService.getPermission()
    }));

    return granted;
  }, []);

  // Notifications prédéfinies pour Calmi
  const notifyStoryReady = useCallback(async (storyTitle: string, storyId: string) => {
    await notificationService.notifyStoryReady(storyTitle, storyId);
  }, []);

  const notifyStoryError = useCallback(async (storyTitle: string, storyId: string) => {
    await notificationService.notifyStoryError(storyTitle, storyId);
  }, []);

  const notifyTitleReady = useCallback(async (storyId: string) => {
    await notificationService.notifyTitleReady(storyId);
  }, []);

  const notifyAudioReady = useCallback(async (storyTitle: string, storyId: string) => {
    await notificationService.notifyAudioReady(storyTitle, storyId);
  }, []);

  const notifyGeneralUpdate = useCallback(async (title: string, body: string) => {
    await notificationService.notifyGeneralUpdate(title, body);
  }, []);

  return {
    ...state,
    requestPermission,
    notifyStoryReady,
    notifyStoryError,
    notifyTitleReady,
    notifyAudioReady,
    notifyGeneralUpdate
  };
};