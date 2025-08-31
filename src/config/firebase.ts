import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "demo-key",
  authDomain: "calmi-app.firebaseapp.com",
  projectId: "calmi-app",
  storageBucket: "calmi-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo"
};

// Initialize Firebase safely
let app;
let messaging;

try {
  if (typeof window !== 'undefined') {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }
} catch (error) {
  console.warn('Firebase initialization failed:', error);
  messaging = null;
}

export { messaging, getToken, onMessage };