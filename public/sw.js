// Service Worker PWA natif pour Calmi
// Remplace firebase-messaging-sw.js

const CACHE_NAME = 'calmi-v1';
const NOTIFICATION_ACTIONS = {
  READ: 'read',
  LIBRARY: 'library', 
  CREATE: 'create',
  HOME: 'home'
};

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Service Worker installé');
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activé');
  event.waitUntil(self.clients.claim());
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification cliquée:', event.notification.tag);
  
  event.notification.close();
  
  const data = event.notification.data || {};
  const action = event.action || data.action || NOTIFICATION_ACTIONS.HOME;
  
  let url = '/';
  
  switch (action) {
    case NOTIFICATION_ACTIONS.READ:
      url = data.storyId ? `/reader/${data.storyId}` : '/library';
      break;
    case NOTIFICATION_ACTIONS.LIBRARY:
      url = '/library';
      break;
    case NOTIFICATION_ACTIONS.CREATE:
      url = '/create-story/step-1';
      break;
    case NOTIFICATION_ACTIONS.HOME:
    default:
      url = '/';
      break;
  }
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Vérifier si une fenêtre est déjà ouverte avec cette URL
      for (const client of clientList) {
        if (client.url.includes(url.split('/')[1]) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Ouvrir une nouvelle fenêtre si aucune n'est trouvée
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification fermée:', event.notification.tag);
  
  // Optionnel : Analytics ou nettoyage
  const data = event.notification.data || {};
  if (data.timestamp) {
    const duration = Date.now() - data.timestamp;
    console.log('[SW] Notification affichée pendant:', duration, 'ms');
  }
});

// Gestion des messages du client principal
self.addEventListener('message', (event) => {
  console.log('[SW] Message reçu:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Synchronisation en arrière-plan (optionnel pour futures fonctionnalités)
self.addEventListener('sync', (event) => {
  console.log('[SW] Sync en arrière-plan:', event.tag);
  
  if (event.tag === 'background-story-check') {
    event.waitUntil(checkPendingStories());
  }
});

// Fonction pour vérifier les histoires en attente (fonctionnalité future)
async function checkPendingStories() {
  try {
    console.log('[SW] Vérification des histoires en attente...');
    // Cette fonction pourrait vérifier périodiquement l'état des histoires
    // et envoyer des notifications même quand l'app est fermée
  } catch (error) {
    console.error('[SW] Erreur lors de la vérification des histoires:', error);
  }
}