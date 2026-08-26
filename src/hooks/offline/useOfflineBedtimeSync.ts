import { useState, useEffect, useCallback } from 'react';
import { offlineStorageService } from '@/services/offline/offlineStorageService';

export const useOfflineBedtimeSync = () => {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [offlineStoryCount, setOfflineStoryCount] = useState<number>(0);

  const refreshOfflineStats = useCallback(async () => {
    const stories = await offlineStorageService.getOfflineStories();
    setOfflineStoryCount(stories.length);
  }, []);

  const syncOfflineData = useCallback(async () => {
    if (navigator.onLine) {
      await offlineStorageService.syncPendingRatings();
      await refreshOfflineStats();
    }
  }, [refreshOfflineStats]);

  useEffect(() => {
    const handleOnline = () => {
      console.log('🌐 [OfflineSync] Connexion Internet rétablie. Synchronisation des données...');
      setIsOnline(true);
      void syncOfflineData();
    };

    const handleOffline = () => {
      console.log('📴 [OfflineSync] Connexion perdue. Bascule en mode hors-ligne.');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    void refreshOfflineStats();
    void syncOfflineData();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineData, refreshOfflineStats]);

  return {
    isOnline,
    offlineStoryCount,
    syncOfflineData,
    refreshOfflineStats,
  };
};
