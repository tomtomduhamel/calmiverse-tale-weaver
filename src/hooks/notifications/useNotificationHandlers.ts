import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface NotificationActionHandlers {
  handleStoryReady: (storyId: string, title?: string) => void;
  handleStoryError: (storyId: string, error?: string) => void;
  handleAudioReady: (storyId: string, title?: string) => void;
  handleNotificationClick: (storyId?: string) => void;
  saveNotificationToHistory: (
    title: string,
    message: string,
    type: 'story_ready' | 'story_error' | 'audio_ready' | 'general',
    storyId?: string
  ) => void;
}

/**
 * Hook centralisé pour gérer les actions liées aux notifications
 * Fournit des handlers réutilisables pour différents types de notifications
 */
export const useNotificationHandlers = (): NotificationActionHandlers => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Sauvegarder une notification dans l'historique
  const saveNotificationToHistory = useCallback((
    title: string,
    message: string,
    type: 'story_ready' | 'story_error' | 'audio_ready' | 'general',
    storyId?: string
  ) => {
    try {
      const notification = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        type,
        timestamp: new Date(),
        storyId,
        read: false
      };

      // Récupérer l'historique existant
      const existingHistory = localStorage.getItem('calmi_notification_history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      
      // Ajouter la nouvelle notification
      history.unshift(notification);
      
      // Limiter à 50 notifications max
      const limitedHistory = history.slice(0, 50);
      
      // Sauvegarder
      localStorage.setItem('calmi_notification_history', JSON.stringify(limitedHistory));
    } catch (error) {
      console.warn('Erreur lors de la sauvegarde de la notification:', error);
    }
  }, []);

  // Handler pour histoire prête
  const handleStoryReady = useCallback((storyId: string, title?: string) => {
    const notificationTitle = '✨ Histoire terminée !';
    const message = title || 'Votre histoire personnalisée est maintenant disponible';
    
    // Sauvegarder dans l'historique
    saveNotificationToHistory(notificationTitle, message, 'story_ready', storyId);
    
    // Toast de confirmation
    toast({
      title: notificationTitle,
      description: message
    });
  }, [navigate, toast, saveNotificationToHistory]);

  // Handler pour erreur d'histoire
  const handleStoryError = useCallback((storyId: string, error?: string) => {
    const notificationTitle = 'Erreur de génération';
    const message = error || 'Une erreur est survenue lors de la création de l\'histoire';
    
    // Sauvegarder dans l'historique
    saveNotificationToHistory(notificationTitle, message, 'story_error', storyId);
    
    // Toast d'erreur
    toast({
      title: notificationTitle,
      description: message,
      variant: 'destructive'
    });
  }, [navigate, toast, saveNotificationToHistory]);

  // Handler pour audio prêt
  const handleAudioReady = useCallback((storyId: string, title?: string) => {
    const notificationTitle = '🔊 Audio disponible !';
    const message = title ? `L'audio de "${title}" est prêt` : 'L\'audio de votre histoire est disponible';
    
    // Sauvegarder dans l'historique
    saveNotificationToHistory(notificationTitle, message, 'audio_ready', storyId);
    
    // Toast de confirmation
    toast({
      title: notificationTitle,
      description: message
    });
  }, [navigate, toast, saveNotificationToHistory]);

  // Handler pour clic sur notification
  const handleNotificationClick = useCallback((storyId?: string) => {
    if (storyId) {
      // Naviguer vers l'histoire spécifique
      navigate(`/reader/${storyId}`);
    } else {
      // Naviguer vers la bibliothèque par défaut
      navigate('/library');
    }
  }, [navigate]);

  return {
    handleStoryReady,
    handleStoryError,
    handleAudioReady,
    handleNotificationClick,
    saveNotificationToHistory
  };
};