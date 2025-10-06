// Kill-Switch Service Worker - Calmi PWA Recovery
// Ce SW s'installe, nettoie tout, puis se désinstalle automatiquement

self.addEventListener('install', (event) => {
  console.log('[Kill-Switch SW] Installation immédiate');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Kill-Switch SW] Activation - nettoyage complet');
  
  event.waitUntil((async () => {
    try {
      // 1. Supprimer tous les caches
      const cacheNames = await caches.keys();
      console.log('[Kill-Switch SW] Suppression de', cacheNames.length, 'caches');
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      
      // 2. Prendre le contrôle immédiat de tous les clients
      await self.clients.claim();
      
      // 3. Forcer le reload de tous les clients avec flag de reset
      const allClients = await self.clients.matchAll({ 
        type: 'window', 
        includeUncontrolled: true 
      });
      
      console.log('[Kill-Switch SW] Reload de', allClients.length, 'clients');
      
      for (const client of allClients) {
        try {
          const url = new URL(client.url);
          // Ajouter flag pour éviter boucle infinie
          if (!url.searchParams.has('sw-reset')) {
            url.searchParams.set('sw-reset', '1');
            client.navigate(url.toString());
          }
        } catch (e) {
          console.warn('[Kill-Switch SW] Erreur navigation client:', e);
        }
      }
      
      // 4. Auto-désinstallation après 2 secondes
      setTimeout(async () => {
        try {
          const success = await self.registration.unregister();
          console.log('[Kill-Switch SW] Désinstallation:', success ? 'OK' : 'FAILED');
        } catch (e) {
          console.warn('[Kill-Switch SW] Erreur désinstallation:', e);
        }
      }, 2000);
      
    } catch (error) {
      console.error('[Kill-Switch SW] Erreur durant activation:', error);
    }
  })());
});

// Stratégie fetch: toujours passer par le réseau (pas de cache)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

console.log('[Kill-Switch SW] Script chargé - en attente installation');