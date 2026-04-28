import { useState, useEffect, useCallback, useRef } from 'react';
import { usePWAAnalytics } from '@/hooks/usePWAAnalytics';
import { isPreviewIframe } from '@/utils/previewDetection';
import { APP_CONFIG } from '@/lib/config';

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
}

// Poll interval: check for updates every 5 minutes
const VERSION_POLL_INTERVAL_MS = 5 * 60 * 1000;

export const usePWA = () => {
  const { track } = usePWAAnalytics();
  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    canInstall: false,
    updateAvailable: false
  });
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  /**
   * Check if a newer version is deployed by fetching /version.json
   * This is the primary, reliable mechanism for update detection.
   */
  const checkVersionFromServer = useCallback(async (manual = false) => {
    try {
      if (manual) setIsCheckingUpdate(true);
      // Cache busting with timestamp parameter
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        console.log('[usePWA] version.json not available (HTTP', response.status + ')');
        return false;
      }

      const data = await response.json();
      const serverVersion = data.version;
      const localVersion = APP_CONFIG.APP_VERSION;

      if (serverVersion && serverVersion !== localVersion) {
        console.log(`[usePWA] 🆕 New version detected! Local: ${localVersion}, Server: ${serverVersion}`);
        setState(prev => ({ ...prev, updateAvailable: true }));
        track('pwa_update_available');

        // Stop polling once we know an update is available
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return true;
      }
      return false;
    } catch (error) {
      // Silently fail - network might be offline or version.json missing in dev
      console.debug('[usePWA] Version check failed (expected in dev):', error);
      return false;
    } finally {
      if (manual) setIsCheckingUpdate(false);
    }
  }, [track]);

  useEffect(() => {
    // Skip in preview iframe
    if (isPreviewIframe()) {
      console.log('[usePWA] Preview mode: skipping all update checks');
      return;
    }

    // --- Install status ---
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    setState(prev => ({ ...prev, isInstalled }));

    // --- SW controllerchange (legacy, kept as backup) ---
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setState(prev => ({ ...prev, updateAvailable: true }));
        track('pwa_update_available');
      });
    }

    // --- Version polling (primary mechanism) ---
    // Initial check after a short delay to let the app stabilize
    const initialCheckTimeout = setTimeout(() => {
      checkVersionFromServer();
    }, 10_000); // 10 seconds after mount

    // Then poll periodically
    pollIntervalRef.current = setInterval(checkVersionFromServer, VERSION_POLL_INTERVAL_MS);

    // --- Online/offline status ---
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      track('pwa_online');
      // Re-check version when coming back online
      checkVersionFromServer();
    };
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      track('pwa_offline');
    };

    // --- Install prompt ---
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({ ...prev, canInstall: true }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(initialCheckTimeout);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [checkVersionFromServer, track]);

  const reloadApp = () => {
    console.warn('[usePWA] Manual reload requested by user');
    window.location.reload();
  };

  return {
    ...state,
    reloadApp,
    checkForUpdate: () => checkVersionFromServer(true),
    isCheckingUpdate
  };
};