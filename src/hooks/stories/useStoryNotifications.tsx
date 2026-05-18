import { useCallback } from 'react';
import { notificationService } from '@/services/notifications/NotificationService';
import { useNotificationPermissions } from '@/hooks/notifications/useNotificationPermissions';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { ToastAction } from '@/components/ui/toast';

export const useStoryNotifications = () => {
  const { canNotify, checkAndRequestIfNeeded } = useNotificationPermissions();
  const { toast } = useToast();
  const navigate = useNavigate();

  const notifyTitlesGenerated = useCallback(async () => {
    // 1. Essayer la notification native
    if (canNotify) {
      try {
        await notificationService.notifyTitlesGenerated();
        console.log('[useStoryNotifications] ✅ Titles generated notification sent (Native)');
        return;
      } catch (error) {
        console.error('[useStoryNotifications] Error sending titles generated notification:', error);
      }
    } else {
      // Tenter de demander la permission si pas encore fait
      const granted = await checkAndRequestIfNeeded();
      if (granted) {
        try {
          await notificationService.notifyTitlesGenerated();
          return;
        } catch (e) {
          // Fallback continue
        }
      }
    }

    // 2. Fallback : Toast
    console.log('[useStoryNotifications] ⚠️ Native notification unavailable, using Toast fallback');
    toast({
      title: "Titres créés ! ✨",
      description: "Vos 3 titres personnalisés sont prêts. Sélectionnez votre préféré !",
      action: <ToastAction altText="Voir" onClick = {() => navigate('/create-story/step-2')}> Voir </ToastAction>,
duration: 8000,
    });
  }, [canNotify, checkAndRequestIfNeeded, toast, navigate]);

const notifyStoryReady = useCallback(async (title: string, storyId: string) => {
  if (canNotify) {
    try {
      await notificationService.notifyStoryReady(title, storyId);
      console.log('[useStoryNotifications] ✅ Story ready notification sent (Native)');
      return;
    } catch (error) {
      console.error('[useStoryNotifications] Error sending story notification:', error);
    }
  }

  // Fallback
  toast({
    title: "Histoire prête ! 📖",
    description: `"${title}" est disponible dans votre bibliothèque.`,
    action: <ToastAction altText="Lire" onClick = {() => navigate(`/app/reader/${storyId}`)}> Lire </ToastAction>,
duration: 8000,
    });
  }, [canNotify, toast, navigate]);

const notifyStoryError = useCallback(async (title: string, storyId: string) => {
  if (canNotify) {
    try {
      await notificationService.notifyStoryError(title, storyId);
      console.log('[useStoryNotifications] ✅ Story error notification sent (Native)');
      return;
    } catch (error) {
      console.error('[useStoryNotifications] Error sending error notification:', error);
    }
  }

  // Fallback
  toast({
    title: "Erreur de génération ❌",
    description: `Impossible de créer "${title}". Veuillez réessayer.`,
    variant: "destructive",
    duration: 8000,
  });
}, [canNotify, toast]);

const notifyAudioReady = useCallback(async (title: string, storyId: string) => {
  if (canNotify) {
    try {
      await notificationService.notifyAudioReady(title, storyId);
      console.log('[useStoryNotifications] ✅ Audio ready notification sent (Native)');
      return;
    } catch (error) {
      console.error('[useStoryNotifications] Error sending audio notification:', error);
    }
  }

  // Fallback
  toast({
    title: "Audio disponible ! 🎵",
    description: `L'audio de "${title}" est prêt à être écouté.`,
    action: <ToastAction altText="Écouter" onClick = {() => navigate(`/app/reader/${storyId}`)}> Écouter </ToastAction>,
duration: 8000,
    });
  }, [canNotify, toast, navigate]);

return {
  notifyTitlesGenerated,
  notifyStoryReady,
  notifyStoryError,
  notifyAudioReady,
  canNotify
};
};