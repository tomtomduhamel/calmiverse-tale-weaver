// @ts-nocheck
// Service Worker PWA natif pour Calmi avec Workbox (injectManifest)
// Gère les notifications et un cache de base

import { clientsClaim } from 'workbox-core';
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'workbox-strategies';
import { swNotificationHandler } from './services/sw-notification-handler';

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

// Gestion avancée des notifications avec persistance
self.addEventListener('notificationclick', (event: any) => {
  event.waitUntil(swNotificationHandler.handleNotificationClick(event));
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event: any) => {
  event.waitUntil(swNotificationHandler.handleBackgroundSync(event));
});

// Gestion des messages depuis l'app principale
self.addEventListener('message', (event: any) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SHOW_NOTIFICATION':
        event.waitUntil(swNotificationHandler.showNotification(event.data.payload));
        break;
      case 'SCHEDULE_SYNC':
        event.waitUntil(swNotificationHandler.scheduleBackgroundSync());
        break;
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
    }
  }
});
