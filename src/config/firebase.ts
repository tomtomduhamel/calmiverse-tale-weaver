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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Cloud Messaging and get a reference to the service
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { getToken, onMessage };