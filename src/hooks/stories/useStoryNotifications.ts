import { useCallback } from 'react';
import { notificationService } from '@/services/notifications/NotificationService';
import { useNotificationPermissions } from '@/hooks/notifications/useNotificationPermissions';

export const useStoryNotifications = () => {
  const { canNotify, checkAndRequestIfNeeded } = useNotificationPermissions();

  const notifyTitlesReady = useCallback(async (storyId: string) => {
    try {
      if (!canNotify) {
        const granted = await checkAndRequestIfNeeded();
        if (!granted) return;
      }
      
      await notificationService.notifyTitleReady(storyId);
      console.log('[useStoryNotifications] ✅ Titles ready notification sent');
    } catch (error) {
      console.error('[useStoryNotifications] Error sending titles notification:', error);
    }
  }, [canNotify, checkAndRequestIfNeeded]);

  const notifyTitlesGenerated = useCallback(async () => {
    try {
      if (!canNotify) {
        const granted = await checkAndRequestIfNeeded();
        if (!granted) return;
      }
      
      await notificationService.notifyTitlesGenerated();
      console.log('[useStoryNotifications] ✅ Titles generated notification sent');
    } catch (error) {
      console.error('[useStoryNotifications] Error sending titles generated notification:', error);
    }
  }, [canNotify, checkAndRequestIfNeeded]);

  const notifyStoryReady = useCallback(async (title: string, storyId: string) => {
    try {
      if (!canNotify) return;
      
      await notificationService.notifyStoryReady(title, storyId);
      console.log('[useStoryNotifications] ✅ Story ready notification sent');
    } catch (error) {
      console.error('[useStoryNotifications] Error sending story notification:', error);
    }
  }, [canNotify]);

  const notifyStoryError = useCallback(async (title: string, storyId: string) => {
    try {
      if (!canNotify) return;
      
      await notificationService.notifyStoryError(title, storyId);
      console.log('[useStoryNotifications] ✅ Story error notification sent');
    } catch (error) {
      console.error('[useStoryNotifications] Error sending error notification:', error);
    }
  }, [canNotify]);

  const notifyAudioReady = useCallback(async (title: string, storyId: string) => {
    try {
      if (!canNotify) return;
      
      await notificationService.notifyAudioReady(title, storyId);
      console.log('[useStoryNotifications] ✅ Audio ready notification sent');
    } catch (error) {
      console.error('[useStoryNotifications] Error sending audio notification:', error);
    }
  }, [canNotify]);

  return {
    notifyTitlesReady,
    notifyTitlesGenerated,
    notifyStoryReady,
    notifyStoryError,
    notifyAudioReady,
    canNotify
  };
};