/**
 * Service Worker Reset Utility
 * Force l'application à repartir proprement en cas de blocage
 */

const SW_RESET_KEY = 'calmi-sw-reset-done';
const SW_VERSION_KEY = 'calmi-sw-version';
const CURRENT_VERSION = '2.0.0'; // Incrémentez pour forcer un reset

export async function forceServiceWorkerReset(): Promise<void> {
  console.log('[SW-Reset] 🔄 Vérification reset Service Worker...');
  
  const lastVersion = localStorage.getItem(SW_VERSION_KEY);
  const resetDone = localStorage.getItem(SW_RESET_KEY);
  
  // Si la version a changé ou si jamais fait de reset, on force
  if (lastVersion !== CURRENT_VERSION || !resetDone) {
    console.log('[SW-Reset] 🧹 Nettoyage complet détecté nécessaire');
    
    try {
      // 1. Unregister tous les Service Workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log(`[SW-Reset] Désactivation de ${registrations.length} Service Worker(s)...`);
        
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
      localStorage.setItem(SW_VERSION_KEY, CURRENT_VERSION);
      localStorage.setItem(SW_RESET_KEY, 'true');
      localStorage.setItem('calmi-last-reset', new Date().toISOString());
      
      console.log('[SW-Reset] ✅ Reset complet terminé');
      
      // 4. Si on était bloqué, reload pour repartir propre
      const wasStuck = sessionStorage.getItem('calmi-was-stuck');
      if (wasStuck || lastVersion !== CURRENT_VERSION) {
        console.log('[SW-Reset] 🔄 Rechargement pour appliquer les changements...');
        sessionStorage.removeItem('calmi-was-stuck');
        
        // Attendre un peu pour que tout soit bien enregistré
        await new Promise(resolve => setTimeout(resolve, 500));
        window.location.reload();
      }
      
    } catch (error) {
      console.error('[SW-Reset] ❌ Erreur pendant le reset:', error);
      // On continue quand même l'exécution
    }
  } else {
    console.log('[SW-Reset] ✅ Déjà à jour (version', CURRENT_VERSION + ')');
  }
}

/**
 * Marquer l'app comme potentiellement bloquée si elle ne monte pas
 */
export function markAppAsStuck(): void {
  sessionStorage.setItem('calmi-was-stuck', 'true');
}

/**
 * Effacer le marqueur de blocage une fois que l'app a bien monté
 */
export function clearStuckMarker(): void {
  sessionStorage.removeItem('calmi-was-stuck');
}

/**
 * Force un reset manuel (pour bouton de dépannage)
 */
export async function manualReset(): Promise<void> {
  console.log('[SW-Reset] 🔧 Reset manuel forcé');
  localStorage.removeItem(SW_RESET_KEY);
  await forceServiceWorkerReset();
}
