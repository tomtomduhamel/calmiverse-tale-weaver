// @ts-nocheck
// Service Worker PWA natif pour Calmi avec Workbox (injectManifest)
// Gère les notifications et un cache de base

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';

// Important: point d'injection du manifeste Workbox
// self.__WB_MANIFEST sera remplacé à la build par la liste des assets à pré-cacher
precacheAndRoute(self.__WB_MANIFEST);

self.skipWaiting();
clientsClaim();

// Routes de cache principales (équivalent de la config workbox précédente)
registerRoute(
  ({ url }) => url.hostname === 'fonts.googleapis.com',
  new CacheFirst({
    cacheName: 'google-fonts-cache',
    plugins: [],
  })
);

registerRoute(
  ({ url }) => url.hostname === 'ioeihnoxvtpxtqhxklpw.supabase.co' && url.pathname.startsWith('/storage/'),
  new CacheFirst({
    cacheName: 'supabase-storage-cache',
  })
);

registerRoute(
  ({ url }) => url.hostname === 'ioeihnoxvtpxtqhxklpw.supabase.co' && url.pathname.startsWith('/rest/'),
  new NetworkFirst({
    cacheName: 'supabase-api-cache',
    networkTimeoutSeconds: 3,
  })
);

registerRoute(
  ({ url }) => /\/api\/.*\.(png|jpg|jpeg|svg|gif)$/.test(url.pathname),
  new CacheFirst({ cacheName: 'api-images' })
);

registerRoute(
  ({ url }) => /\/(library|create-story|kids)/.test(url.pathname),
  new StaleWhileRevalidate({ cacheName: 'app-pages' })
);

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event: any) => {
  event.notification.close();
  const data = event.notification?.data || {};
  const action = event.action || data.action || 'home';

  let url = '/';
  switch (action) {
    case 'read':
      url = data.storyId ? `/reader/${data.storyId}` : '/library';
      break;
    case 'library':
      url = '/library';
      break;
    case 'create':
      url = '/create-story/step-1';
      break;
    case 'home':
    default:
      url = '/';
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList: any[]) => {
      for (const client of clientList) {
        if (client.url.includes(url.split('/')[1]) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', (event: any) => {
  // Optionnel: analytics
});

self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('sync', (event: any) => {
  // Placeholder pour futures syncs
});
