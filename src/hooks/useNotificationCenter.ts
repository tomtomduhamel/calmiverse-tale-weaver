
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { NotificationType, NotificationOptions } from '@/types/notification';
import { ToastAction } from '@/components/ui/toast';
import React from 'react';

/**
 * Hook qui centralise et uniformise les notifications dans l'application
 * Fournit une interface unifiée pour afficher différents types de notifications
 */
export const useNotificationCenter = () => {
  const { toast } = useToast();
  
  // Fonction générique pour notifier
  const notify = useCallback((type: NotificationType, title: string, description: string, options?: NotificationOptions) => {
    console.log(`[Notification] ${type}: ${title} - ${description}`);
    
    let className = '';
    
    // Applique des styles spécifiques selon le type
    switch (type) {
      case 'success':
        className = 'bg-green-50 border-green-300 text-green-800';
        break;
      case 'warning':
        className = 'bg-amber-50 border-amber-300 text-amber-800';
        break;
      case 'error':
        // Pas besoin de classe personnalisée, utilise le variant destructive
        break;
      case 'info':
      default:
        className = 'bg-blue-50 border-blue-300 text-blue-800';
        break;
    }
    
    // Création de l'élément d'action si nécessaire
    const actionElement = options?.action ? React.createElement(
      ToastAction,
      { onClick: options.action.onClick },
      options.action.label
    ) : undefined;
    
    toast({
      title,
      description,
      variant: type === 'error' ? 'destructive' : 'default',
      className: type !== 'error' ? (options?.className || className) : undefined,
      duration: options?.duration || (type === 'error' ? 7000 : 5000),
      action: actionElement,
    });
  }, [toast]);
  
  // Notification de succès avec style cohérent
  const notifySuccess = useCallback((title: string, description: string, options?: NotificationOptions) => {
    notify('success', title, description, options);
  }, [notify]);
  
  // Notification d'erreur avec style cohérent
  const notifyError = useCallback((title: string, description: string, options?: NotificationOptions) => {
    notify('error', title, description, options);
  }, [notify]);
  
  // Notification d'information avec style cohérent
  const notifyInfo = useCallback((title: string, description: string, options?: NotificationOptions) => {
    notify('info', title, description, options);
  }, [notify]);
  
  // Notification d'avertissement avec style cohérent
  const notifyWarning = useCallback((title: string, description: string, options?: NotificationOptions) => {
    notify('warning', title, description, options);
  }, [notify]);
  
  return {
    notify,
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning
  };
};
