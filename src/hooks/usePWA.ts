import { useState, useEffect } from 'react';
import { usePWAAnalytics } from '@/hooks/usePWAAnalytics';
import { isPreviewIframe } from '@/utils/previewDetection';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
}

export const usePWA = () => {
  const { track } = usePWAAnalytics();
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    canInstall: false,
    updateAvailable: false
  });

  useEffect(() => {
    // Check if app is installed
    const checkInstallStatus = () => {
      const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                         (window.navigator as any).standalone === true;
      setState(prev => ({ ...prev, isInstalled }));
    };

    // Check for update availability
    const checkForUpdates = () => {
      // Skip SW operations in preview iframe
      if (isPreviewIframe()) {
        console.log('[usePWA] Preview mode: skipping SW update checks');
        return;
      }
      
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          setState(prev => ({ ...prev, updateAvailable: true }));
          track('pwa_update_available');
        });
      }
    };

    // Online/offline status
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      track('pwa_online');
    };
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      track('pwa_offline');
    };

    // BeforeInstallPrompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({ ...prev, canInstall: true }));
    };

    checkInstallStatus();
    checkForUpdates();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const reloadApp = () => {
    console.warn('[usePWA] Manual reload requested by user');
    window.location.reload();
  };

  return {
    ...state,
    reloadApp
  };
};