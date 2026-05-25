import { useState, useEffect, useCallback, useRef } from 'react';
import { usePWAAnalytics } from '@/hooks/usePWAAnalytics';
import { isPreviewIframe } from '@/utils/previewDetection';

// ─── Constants ────────────────────────────────────────────────────────────────

/** How often we trigger reg.update() in the background. */
const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

// ─── Types ────────────────────────────────────────────────────────────────────

interface PWAState {
  isInstalled: boolean;
  isOnline: boolean;
  canInstall: boolean;
  updateAvailable: boolean;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * PWA update detection — reliable approach.
 *
 * WHY THIS DESIGN:
 * The old approach relied on (a) `version.json` fetched from the CDN and
 * (b) the `controllerchange` event to detect SW updates.  Both had
 * systematic failure modes on Lovable's hosting:
 *
 *   • version.json CDN cache: Lovable's CDN does not honour `public/_headers`
 *     (Netlify-only syntax), so version.json was served stale after deploys,
 *     making the version comparison always return "up to date".
 *
 *   • controllerchange race condition: with `skipWaiting: true` in workbox,
 *     the new SW auto-activated immediately on install.  If this happened
 *     during the initial page load (before React's useEffect ran), the
 *     controllerchange event was missed and updateAvailable stayed false.
 *
 * THE FIX:
 *   1. `skipWaiting` removed from vite.config.ts → new SW waits in
 *      `reg.waiting` instead of auto-activating.
 *   2. We detect updates by checking `reg.waiting` directly — a synchronous,
 *      persistent property, not a one-shot event.  No race condition possible.
 *   3. We call `reg.update()` periodically to trigger fresh SW fetches.
 *      When the SW content changes, the browser installs the new SW and
 *      sets `reg.waiting`.  Our next periodic check (or the updatefound
 *      listener) catches it immediately.
 *   4. The update is only applied (SKIP_WAITING) when the user confirms
 *      via the notification banner, never silently.
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
  // Guard: only call markUpdateAvailable once per session.
  const updateMarkedRef = useRef(false);

  // ── markUpdateAvailable ──────────────────────────────────────────────────

  const markUpdateAvailable = useCallback(() => {
    if (updateMarkedRef.current) return;
    updateMarkedRef.current = true;
    console.log('[usePWA] 🆕 Update available — waiting SW detected');
    setState(prev => ({ ...prev, updateAvailable: true }));
    track('pwa_update_available');
    // Stop polling once an update is confirmed.
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, [track]);

  // ── checkRegistration ────────────────────────────────────────────────────
  //
  // Core check: look at reg.waiting (reliable, no race condition), then
  // trigger reg.update() so the browser re-fetches sw.js from the network.
  // If the SW content has changed, the browser installs it and sets
  // reg.waiting, which we catch via the `updatefound` listener below.

  const checkRegistration = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return false;
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return false;

      // Primary signal: is there already a waiting SW?
      if (reg.waiting) {
        markUpdateAvailable();
        return true;
      }

      // Secondary signal: ask the browser to re-fetch sw.js from the network.
      // If the content changed, updatefound fires → statechange to 'installed'
      // → reg.waiting is set → our updatefound listener (added in useEffect)
      //   calls markUpdateAvailable().
      reg.update().catch(() => {});
      return false;
    } catch {
      return false;
    }
  }, [markUpdateAvailable]);

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
      if (!('serviceWorker' in navigator)) {
        return { updateAvailable: false, checkFailed: true };
      }

      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        return { updateAvailable: false, checkFailed: true };
      }

      // Step 1 — immediate reg.waiting check
      if (reg.waiting) {
        markUpdateAvailable();
        return { updateAvailable: true, checkFailed: false };
      }

      // Step 2 — trigger a fresh SW fetch from the network and wait
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
        // Give the network fetch up to 12 seconds.
        setTimeout(() => settle(false), 12_000);
        reg.update().catch(() => settle(false));
      });

      if (found) {
        markUpdateAvailable();
        return { updateAvailable: true, checkFailed: false };
      }

      // Step 3 — one final check in case the SW installed between steps
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
  }, [markUpdateAvailable]);

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
