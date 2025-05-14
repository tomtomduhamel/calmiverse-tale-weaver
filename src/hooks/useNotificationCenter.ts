
import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

/**
 * Hook qui centralise et uniformise les notifications dans l'application
 * Fournit une interface unifiée pour afficher différents types de notifications
 */
export const useNotificationCenter = () => {
  const { toast } = useToast();
  
  // Notification de succès avec style cohérent
  const notifySuccess = useCallback((title: string, description: string) => {
    console.log(`[Notification] Succès: ${title} - ${description}`);
    
    toast({
      title,
      description,
      variant: 'default',
      duration: 5000
    });
  }, [toast]);
  
  // Notification d'erreur avec style cohérent
  const notifyError = useCallback((title: string, description: string) => {
    console.log(`[Notification] Erreur: ${title} - ${description}`);
    
    toast({
      title,
      description,
      variant: 'destructive',
      duration: 7000
    });
  }, [toast]);
  
  // Notification d'information avec style cohérent
  const notifyInfo = useCallback((title: string, description: string) => {
    console.log(`[Notification] Info: ${title} - ${description}`);
    
    toast({
      title,
      description,
      variant: 'default',
      duration: 4000
    });
  }, [toast]);
  
  // Notification d'avertissement avec style cohérent
  const notifyWarning = useCallback((title: string, description: string) => {
    console.log(`[Notification] Avertissement: ${title} - ${description}`);
    
    toast({
      title,
      description,
      variant: 'default',
      className: 'bg-amber-50 border-amber-300 text-amber-800',
      duration: 6000
    });
  }, [toast]);
  
  return {
    notifySuccess,
    notifyError,
    notifyInfo,
    notifyWarning
  };
};
