import { useState, useEffect } from 'react';
import { messaging, getToken, onMessage } from '@/config/firebase';

interface NotificationState {
  permission: NotificationPermission;
  token: string | null;
  isSupported: boolean;
  isLoading: boolean;
}

export const useNotifications = () => {
  const [state, setState] = useState<NotificationState>({
    permission: 'default',
    token: null,
    isSupported: false,
    isLoading: true
  });

  useEffect(() => {
    const checkNotificationSupport = async () => {
      const isSupported = 'Notification' in window && 'serviceWorker' in navigator && !!messaging;
      
      setState(prev => ({
        ...prev,
        isSupported,
        permission: isSupported ? Notification.permission : 'denied',
        isLoading: false
      }));

      if (isSupported && messaging) {
        try {
          // Listen for foreground messages
          onMessage(messaging, (payload) => {
            console.log('Foreground message received:', payload);
            
            // Show custom in-app notification
            if (payload.notification) {
              new Notification(payload.notification.title || 'Calmi', {
                body: payload.notification.body,
                icon: '/icon-192.png'
              });
            }
          });
        } catch (error) {
          console.warn('Firebase messaging setup failed:', error);
        }
      }
    };

    checkNotificationSupport();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!state.isSupported || !messaging) {
      console.warn('Notifications not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        try {
          const token = await getToken(messaging, {
            vapidKey: 'demo-vapid-key' // Replace with actual VAPID key
          });
          
          setState(prev => ({
            ...prev,
            permission,
            token
          }));
          
          console.log('Notification token:', token);
          return true;
        } catch (tokenError) {
          console.warn('Could not get FCM token:', tokenError);
          setState(prev => ({ ...prev, permission }));
          return true; // Permission still granted even if token fails
        }
      } else {
        setState(prev => ({ ...prev, permission }));
        return false;
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
      return false;
    }
  };

  const sendTestNotification = () => {
    if (state.permission === 'granted') {
      new Notification('Test Calmi', {
        body: 'Votre histoire est prête à être lue !',
        icon: '/icon-192.png',
        tag: 'test-notification'
      });
    }
  };

  return {
    ...state,
    requestPermission,
    sendTestNotification
  };
};