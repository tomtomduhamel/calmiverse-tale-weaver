/**
 * Service Worker Reset Utility
 * Force l'application à repartir proprement en cas de blocage
 */

import { safeStorage, safeSessionStorage } from './safeStorage';
import { APP_CONFIG } from '@/lib/config';

const SW_RESET_KEY = 'calmi-sw-reset-done';
const SW_VERSION_KEY = 'calmi-sw-version';
const CURRENT_VERSION = APP_CONFIG.APP_VERSION; // Source de vérité unifiée

export interface ResetResult {
  didCleanup: boolean;
  needsReload: boolean;
}

export async function forceServiceWorkerReset(): Promise<ResetResult> {
  console.log('[SW-Reset] 🔄 Vérification reset Service Worker...');
  
  // PHASE 3: Skip complètement en mode preview
  if ((window as any).__CALMI_PREVIEW_MODE) {
    console.log('[SW-Reset] ⏭️ Preview mode - skip SW reset');
    return { didCleanup: false, needsReload: false };
  }
  
  // Safe mode: ne jamais indiquer de reload nécessaire
  const safeMode = safeStorage.getItem('calmi_safe_mode') === '1';
  const lastVersion = safeStorage.getItem(SW_VERSION_KEY);
  const resetDone = safeStorage.getItem(SW_RESET_KEY);
  
  // Si la version a changé ou si jamais fait de reset, on force
  if (lastVersion !== CURRENT_VERSION || !resetDone) {
    console.log('[SW-Reset] 🧹 Nettoyage complet détecté nécessaire');
    
    try {
      let swCount = 0;
      
      // 1. Unregister tous les Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        swCount = registrations.length;
        console.log(`[SW-Reset] Désactivation de ${swCount} Service Worker(s)...`);
        
        await Promise.all(
          registrations.map(registration => registration.unregister())
        );
      }
      
      // 2. Clear tous les caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`[SW-Reset] Suppression de ${cacheNames.length} cache(s)...`);
        
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }
      
      // 3. Marquer le reset comme fait
      safeStorage.setItem(SW_VERSION_KEY, CURRENT_VERSION);
      safeStorage.setItem(SW_RESET_KEY, 'true');
      safeStorage.setItem('calmi-last-reset', new Date().toISOString());
      
      console.log('[SW-Reset] ✅ Reset complet terminé');
      
      // 4. NE JAMAIS RELOADER AUTOMATIQUEMENT
      // Retourner un indicateur pour que l'appelant décide
      const needsReload = !safeMode && (swCount > 0 || lastVersion !== CURRENT_VERSION);
      
      if (needsReload) {
        console.log('[SW-Reset] ℹ️ Un rechargement serait bénéfique (mais pas forcé)');
      }
      
      return { didCleanup: true, needsReload };
      
    } catch (error) {
      console.error('[SW-Reset] ❌ Erreur pendant le reset:', error);
      return { didCleanup: false, needsReload: false };
    }
  } else {
    console.log('[SW-Reset] ✅ Déjà à jour (version', CURRENT_VERSION + ')');
    return { didCleanup: false, needsReload: false };
  }
}

/**
 * Marquer l'app comme potentiellement bloquée si elle ne monte pas
 */
export function markAppAsStuck(): void {
  safeSessionStorage.setItem('calmi-was-stuck', 'true');
}

/**
 * Effacer le marqueur de blocage une fois que l'app a bien monté
 */
export function clearStuckMarker(): void {
  safeSessionStorage.removeItem('calmi-was-stuck');
}

/**
 * Force un reset manuel (pour bouton de dépannage)
 */
export async function manualReset(): Promise<void> {
  console.log('[SW-Reset] 🔧 Reset manuel forcé');
  safeStorage.removeItem(SW_RESET_KEY);
  await forceServiceWorkerReset();
}
