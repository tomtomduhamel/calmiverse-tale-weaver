import { useState, useEffect, useCallback } from 'react';

interface NotificationState {
  permission: NotificationPermission;
  isSupported: boolean;
  isLoading: boolean;
}

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
}

/**
 * Hook pour gérer les notifications PWA natives
 * Remplace le système Firebase pour une approche plus simple et native
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
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
        isLoading: false
      }));
    };

    checkSupport();
  }, []);

  // Demander la permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      console.warn('[useNativePWANotifications] Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      setState(prev => ({
        ...prev,
        permission
      }));

      console.log('[useNativePWANotifications] Permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('[useNativePWANotifications] Error requesting permission:', error);
      return false;
    }
  }, [state.isSupported]);

  // Envoyer une notification
  const sendNotification = useCallback((options: NotificationOptions) => {
    if (!state.isSupported || state.permission !== 'granted') {
      console.warn('[useNativePWANotifications] Cannot send notification:', {
        supported: state.isSupported,
        permission: state.permission
      });
      return null;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192.png',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      });

      // Gérer les clics sur la notification
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Traiter les données de la notification
        if (options.data?.action && options.data?.storyId) {
          switch (options.data.action) {
            case 'read':
              window.location.href = `/reader/${options.data.storyId}`;
              break;
            case 'library':
              window.location.href = '/library';
              break;
            default:
              window.location.href = '/';
          }
        }
        
        notification.close();
      };

      console.log('[useNativePWANotifications] Notification sent:', options.title);
      return notification;
    } catch (error) {
      console.error('[useNativePWANotifications] Error sending notification:', error);
      return null;
    }
  }, [state.isSupported, state.permission]);

  // Notifications prédéfinies pour Calmi
  const notifyStoryReady = useCallback((storyTitle: string, storyId: string) => {
    return sendNotification({
      title: '✨ Histoire prête !',
      body: `"${storyTitle}" est maintenant disponible`,
      tag: `story-ready-${storyId}`,
      data: { action: 'read', storyId },
      requireInteraction: true
    });
  }, [sendNotification]);

  const notifyStoryError = useCallback((storyTitle: string, storyId: string) => {
    return sendNotification({
      title: '❌ Erreur de génération',
      body: `Impossible de créer "${storyTitle}". Cliquez pour réessayer.`,
      tag: `story-error-${storyId}`,
      data: { action: 'library', storyId }
    });
  }, [sendNotification]);

  const notifyGeneralUpdate = useCallback((title: string, body: string) => {
    return sendNotification({
      title,
      body,
      tag: 'calmi-update',
      data: { action: 'library' }
    });
  }, [sendNotification]);

  return {
    ...state,
    requestPermission,
    sendNotification,
    notifyStoryReady,
    notifyStoryError,
    notifyGeneralUpdate
  };
};