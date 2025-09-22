import { useState, useEffect, useCallback } from 'react';
import { notificationService } from '@/services/notifications/NotificationService';
import { useToast } from '@/hooks/use-toast';

interface NotificationPermissionsState {
  permission: NotificationPermission;
  isSupported: boolean;
  isLoading: boolean;
}

export const useNotificationPermissions = () => {
  const [state, setState] = useState<NotificationPermissionsState>({
    permission: 'default',
    isSupported: false,
    isLoading: false
  });
  const { toast } = useToast();

  // Check initial state
  useEffect(() => {
    setState({
      permission: notificationService.getPermission(),
      isSupported: notificationService.isSupported(),
      isLoading: false
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!state.isSupported) {
      toast({
        title: "Notifications non supportées",
        description: "Votre navigateur ne supporte pas les notifications",
        variant: "destructive"
      });
      return false;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const granted = await notificationService.requestPermission();
      const newPermission = notificationService.getPermission();
      
      setState({
        permission: newPermission,
        isSupported: state.isSupported,
        isLoading: false
      });

      if (granted) {
        toast({
          title: "Notifications activées ✅",
          description: "Vous recevrez des notifications pour vos histoires"
        });
      } else {
        toast({
          title: "Notifications désactivées",
          description: "Vous pouvez les activer dans les paramètres de votre navigateur",
          variant: "destructive"
        });
      }

      return granted;
    } catch (error) {
      console.error('[useNotificationPermissions] Error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      
      toast({
        title: "Erreur",
        description: "Impossible d'activer les notifications",
        variant: "destructive"
      });
      
      return false;
    }
  }, [state.isSupported, toast]);

  const checkAndRequestIfNeeded = useCallback(async () => {
    if (state.isSupported && state.permission === 'default') {
      return await requestPermission();
    }
    return state.permission === 'granted';
  }, [state.isSupported, state.permission, requestPermission]);

  return {
    ...state,
    requestPermission,
    checkAndRequestIfNeeded,
    canNotify: state.isSupported && state.permission === 'granted'
  };
};