// Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "demo-key",
  authDomain: "calmi-app.firebaseapp.com",
  projectId: "calmi-app",
  storageBucket: "calmi-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);
  
  const notificationTitle = payload.notification?.title || 'Calmi';
  const notificationOptions = {
    body: payload.notification?.body || 'Nouvelle notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'calmi-notification',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const url = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});