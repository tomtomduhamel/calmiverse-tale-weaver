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
   * Check if a newer version is deployed by fetching /version.json.
   * Returns { updateAvailable, checkFailed } so callers can distinguish
   * a genuine "up to date" from a failed network/server request.
   *
   * Two independent signals trigger an update:
   *   1. version string mismatch  (semver+buildId)
   *   2. buildNumber increase     (YYMMDD.HHMM — always unique per build)
   * Signal #2 guards against LOVABLE_BUILD_ID being a fixed env var that
   * makes every deployment produce the same version string.
   */
  const checkVersionFromServer = useCallback(async (manual = false): Promise<{ updateAvailable: boolean; checkFailed: boolean }> => {
    try {
      if (manual) setIsCheckingUpdate(true);
      const response = await fetch(`/version.json?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (!response.ok) {
        console.warn('[usePWA] version.json not available (HTTP', response.status + ')');
        return { updateAvailable: false, checkFailed: true };
      }

      const data = await response.json();
      const serverVersion: string | undefined = data.version;
      const serverBuild: string | undefined = data.buildNumber;
      const localVersion = APP_CONFIG.APP_VERSION;
      const localBuild = APP_CONFIG.APP_BUILD_NUMBER;

      // Signal 1: version string changed (catches semver bumps and buildId changes)
      const versionMismatch = Boolean(serverVersion && serverVersion !== localVersion);
      // Signal 2: build timestamp advanced (catches re-deploys with same version string)
      // String comparison works for YYMMDD.HHMM format (zero-padded, lexicographically monotone).
      const buildAdvanced = Boolean(serverBuild && localBuild && serverBuild > localBuild);

      if (versionMismatch || buildAdvanced) {
        console.log(
          `[usePWA] 🆕 New version detected! version: ${localVersion} → ${serverVersion ?? '?'} | build: ${localBuild ?? '?'} → ${serverBuild ?? '?'}`
        );
        setState(prev => ({ ...prev, updateAvailable: true }));
        track('pwa_update_available');

        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        return { updateAvailable: true, checkFailed: false };
      }
      return { updateAvailable: false, checkFailed: false };
    } catch (error) {
      console.warn('[usePWA] Version check failed:', error);
      return { updateAvailable: false, checkFailed: true };
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
    let swUpdateInterval: ReturnType<typeof setInterval> | null = null;
    const triggerSkipWaiting = (reg: ServiceWorkerRegistration) => {
      if (reg.waiting) {
        console.log('[usePWA] 📨 Posting SKIP_WAITING to waiting SW');
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setState(prev => ({ ...prev, updateAvailable: true }));
        track('pwa_update_available');
      });

      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        // If a waiting SW already exists, activate it now.
        triggerSkipWaiting(reg);

        // Watch for new SW installations and auto-skip waiting.
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[usePWA] 🆕 New SW installed — skipping waiting');
              triggerSkipWaiting(reg);
              setState(prev => ({ ...prev, updateAvailable: true }));
            }
          });
        });

        // Force update checks periodically + on focus/online
        const checkSW = () => reg.update().catch(() => {});
        swUpdateInterval = setInterval(checkSW, VERSION_POLL_INTERVAL_MS);
        const onFocus = () => checkSW();
        window.addEventListener('focus', onFocus);
        window.addEventListener('online', onFocus);
        // Cleanup attached below via returned function (closure capture)
        (window as any).__calmiSWCleanup = () => {
          window.removeEventListener('focus', onFocus);
          window.removeEventListener('online', onFocus);
        };
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
      if (swUpdateInterval) clearInterval(swUpdateInterval);
      if ((window as any).__calmiSWCleanup) (window as any).__calmiSWCleanup();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [checkVersionFromServer, track]);

  const [isReloading, setIsReloading] = useState(false);

  const reloadApp = useCallback(async () => {
    if (isReloading) return;
    setIsReloading(true);
    console.warn('[usePWA] Manual reload requested by user');

    const purgeCachesAndReload = async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
          console.log('[usePWA] 🧹 Caches purged');
        }
      } catch (e) {
        console.warn('[usePWA] Cache purge failed:', e);
      }
      // Cache-busting query to defeat any remaining HTTP cache / bfcache
      const url = new URL(window.location.href);
      url.searchParams.set('_swr', Date.now().toString(36));
      window.location.replace(url.toString());
    };

    try {
      if (!('serviceWorker' in navigator)) {
        await purgeCachesAndReload();
        return;
      }
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        await purgeCachesAndReload();
        return;
      }

      // If there's a waiting SW, ask it to activate, then reload on controllerchange
      const waiting = reg.waiting || reg.installing;
      if (waiting) {
        let done = false;
        const onControllerChange = async () => {
          if (done) return;
          done = true;
          navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
          await purgeCachesAndReload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
        try {
          waiting.postMessage({ type: 'SKIP_WAITING' });
        } catch (e) {
          console.warn('[usePWA] postMessage SKIP_WAITING failed:', e);
        }
        // Safety net if controllerchange never fires
        setTimeout(() => {
          if (!done) {
            done = true;
            console.warn('[usePWA] controllerchange timeout — forcing reload');
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            purgeCachesAndReload();
          }
        }, 3000);
        return;
      }

      // No waiting SW — try to refresh registration first, then reload
      try {
        await reg.update();
      } catch {}
      await purgeCachesAndReload();
    } catch (e) {
      console.error('[usePWA] reloadApp failed:', e);
      await purgeCachesAndReload();
    }
  }, [isReloading]);

  return {
    ...state,
    reloadApp,
    isReloading,
    checkForUpdate: () => checkVersionFromServer(true),
    isCheckingUpdate
  };
};