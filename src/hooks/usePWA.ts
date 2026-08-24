import { useState, useEffect, useCallback, useRef } from 'react';
import { usePWAAnalytics } from '@/hooks/usePWAAnalytics';
import { isPreviewIframe } from '@/utils/previewDetection';
import { APP_CONFIG } from '@/lib/config';

// ─── Constants ────────────────────────────────────────────────────────────────

/** How often we trigger reg.update() in the background. */
const POLL_INTERVAL_MS = 3 * 60 * 1000; // 3 minutes

// ─── Types ────────────────────────────────────────────────────────────────────

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * PWA update detection — multi-layered robust approach.
 * Combines direct server version.json inspection with ServiceWorker lifecycle checks.
 */
export const usePWA = () => {
  const { track } = usePWAAnalytics();

  const [state, setState] = useState<PWAState>({
    isInstalled: false,
    isOnline: navigator.onLine,
    canInstall: false,
    updateAvailable: false,
  });

  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const updateMarkedRef = useRef(false);

  // ── markUpdateAvailable ──────────────────────────────────────────────────

  const markUpdateAvailable = useCallback(() => {
    if (updateMarkedRef.current) return;
    updateMarkedRef.current = true;
    console.log('[usePWA] 🆕 Update available detected');
    setState(prev => ({ ...prev, updateAvailable: true }));
    track('pwa_update_available');
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [track]);

  // ── checkServerVersion ───────────────────────────────────────────────────
  // Inspects /version.json with cache-busting timestamp directly on the origin.

  const checkServerVersion = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/version.json?_t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
        },
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data && (data.buildNumber || data.version)) {
        const serverBuild = data.buildNumber;
        const clientBuild = APP_CONFIG.APP_BUILD_NUMBER;
        const serverVer = data.version;
        const clientVer = APP_CONFIG.APP_VERSION;

        if (serverBuild && clientBuild && serverBuild !== clientBuild) {
          console.log(`[usePWA] 🆕 Newer server build (${serverBuild}) vs client (${clientBuild})`);
          markUpdateAvailable();
          return true;
        }

        if (serverVer && clientVer && serverVer !== clientVer) {
          console.log(`[usePWA] 🆕 Newer server version (${serverVer}) vs client (${clientVer})`);
          markUpdateAvailable();
          return true;
        }
      }
      return false;
    } catch (e) {
      console.warn('[usePWA] checkServerVersion network error:', e);
      return false;
    }
  }, [markUpdateAvailable]);

  // ── checkRegistration ────────────────────────────────────────────────────

  const checkRegistration = useCallback(async () => {
    // 1. Primary check: version.json on server
    const serverHasUpdate = await checkServerVersion();
    if (serverHasUpdate) return true;

    // 2. Secondary check: ServiceWorker state
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return false;

      if (reg.waiting) {
        markUpdateAvailable();
        return true;
      }

      reg.update().catch(() => {});
      return false;
    } catch {
      return false;
    }
  }, [checkServerVersion, markUpdateAvailable]);

  // ── Main effect ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (isPreviewIframe()) {
      console.log('[usePWA] Preview mode: skipping update checks');
      return;
    }

    // Detect install status
    const isInstalled =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;
    setState(prev => ({ ...prev, isInstalled }));

    if (!('serviceWorker' in navigator)) return;

    // Set up SW listeners once the registration is available
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      // Immediately check if a waiting SW already exists (e.g. was downloaded
      // in a previous session and is sitting in reg.waiting).
      if (reg.waiting) {
        console.log('[usePWA] 🆕 Waiting SW found on mount');
        markUpdateAvailable();
        return;
      }

      // Watch for new SW installations during this session.
      // When the new SW reaches 'installed' state it sits in reg.waiting —
      // we mark the update available so the user sees the banner.
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;
        newWorker.addEventListener('statechange', () => {
          // 'installed' means the SW is ready and waiting.
          // We do NOT call skipWaiting here — that's the user's choice.
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[usePWA] 🆕 New SW installed — now in waiting state');
            markUpdateAvailable();
          }
        });
      });
    });

    // Periodic update trigger: call reg.update() every POLL_INTERVAL_MS.
    // Also checks reg.waiting each time in case we somehow missed the event.
    pollIntervalRef.current = setInterval(checkRegistration, POLL_INTERVAL_MS);

    // Initial check after the app stabilises (10 s after mount).
    const initialTimeout = setTimeout(checkRegistration, 10_000);

    // Re-trigger on window focus (user switches back to the tab) and on
    // coming back online.
    const onFocusOrOnline = () => checkRegistration();
    window.addEventListener('focus', onFocusOrOnline);
    window.addEventListener('online', onFocusOrOnline);

    // Online / offline state
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      track('pwa_online');
    };
    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
      track('pwa_offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setState(prev => ({ ...prev, canInstall: true }));
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      clearTimeout(initialTimeout);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      window.removeEventListener('focus', onFocusOrOnline);
      window.removeEventListener('online', onFocusOrOnline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [checkRegistration, markUpdateAvailable, track]);

  // ── checkForUpdate (manual — Settings page button) ───────────────────────

  /**
   * Called when the user clicks "Vérifier les mises à jour".
   * 1. Check reg.waiting immediately.
   * 2. If nothing, call reg.update() and wait up to 12 s for the new SW
   *    to install (updatefound → statechange → 'installed' → reg.waiting).
   * 3. Check reg.waiting again after the wait.
   */
  const checkForUpdate = useCallback(async (): Promise<{ updateAvailable: boolean; checkFailed: boolean }> => {
    setIsCheckingUpdate(true);
    try {
      // Step 1 — Check direct server version.json with cache-buster
      const serverHasUpdate = await checkServerVersion();
      if (serverHasUpdate) {
        markUpdateAvailable();
        return { updateAvailable: true, checkFailed: false };
      }

      if (!('serviceWorker' in navigator)) {
        return { updateAvailable: false, checkFailed: false };
      }

      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        return { updateAvailable: false, checkFailed: false };
      }

      // Step 2 — Check if a waiting SW exists
      if (reg.waiting) {
        markUpdateAvailable();
        return { updateAvailable: true, checkFailed: false };
      }

      // Step 3 — Trigger a fresh SW fetch from the network and wait up to 8s
      const found = await new Promise<boolean>((resolve) => {
        let settled = false;
        const settle = (result: boolean) => {
          if (settled) return;
          settled = true;
          reg.removeEventListener('updatefound', onUpdateFound);
          resolve(result);
        };

        const onUpdateFound = () => {
          const newWorker = reg.installing;
          if (!newWorker) { settle(false); return; }
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              settle(true);
            }
          });
        };

        reg.addEventListener('updatefound', onUpdateFound);
        setTimeout(() => settle(false), 8_000);
        reg.update().catch(() => settle(false));
      });

      if (found) {
        markUpdateAvailable();
        return { updateAvailable: true, checkFailed: false };
      }

      if (reg.waiting) {
        markUpdateAvailable();
        return { updateAvailable: true, checkFailed: false };
      }

      return { updateAvailable: false, checkFailed: false };
    } catch (e) {
      console.warn('[usePWA] checkForUpdate failed:', e);
      return { updateAvailable: false, checkFailed: true };
    } finally {
      setIsCheckingUpdate(false);
    }
  }, [checkServerVersion, markUpdateAvailable]);

  // ── reloadApp ────────────────────────────────────────────────────────────

  const reloadApp = useCallback(async () => {
    if (isReloading) return;
    setIsReloading(true);
    console.warn('[usePWA] Reload requested by user');

    const purgeCachesAndReload = async () => {
      try {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k)));
          console.log('[usePWA] 🧹 All caches purged');
        }
      } catch (e) {
        console.warn('[usePWA] Cache purge failed:', e);
      }
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

      const waiting = reg.waiting || reg.installing;
      if (waiting) {
        // Post SKIP_WAITING to the new SW, then reload once it takes control.
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
        // Safety net: force reload if controllerchange never fires.
        setTimeout(() => {
          if (!done) {
            done = true;
            navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
            console.warn('[usePWA] controllerchange timeout — forcing reload');
            purgeCachesAndReload();
          }
        }, 3_000);
        return;
      }

      // No waiting SW — just purge caches and reload.
      await purgeCachesAndReload();
    } catch (e) {
      console.error('[usePWA] reloadApp failed:', e);
      await purgeCachesAndReload();
    }
  }, [isReloading]);

  // ── Public API ───────────────────────────────────────────────────────────

  return {
    ...state,
    reloadApp,
    isReloading,
    checkForUpdate,
    isCheckingUpdate,
  };
};
