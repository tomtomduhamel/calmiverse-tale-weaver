import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCVFRZKBvJEMB6mXbdWB3h_oJTSb-VstdE",
  authDomain: "calmi-99482.firebaseapp.com",
  projectId: "calmi-99482",
  storageBucket: "calmi-99482.firebasestorage.app",
  messagingSenderId: "811759661179",
  appId: "1:811759661179:web:0dc8e3609f4ea0972a72de",
  measurementId: "G-T4WEMQLSMZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized successfully with config:', {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain
});

// Initialize Firestore
export const db = getFirestore(app);
console.log('Firestore initialized with project ID:', firebaseConfig.projectId);

// Initialize Auth
export const auth = getAuth(app);
console.log('Auth initialized');

// Initialize Analytics only if window is available (browser environment)
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
console.log('Analytics initialization attempted');

// Test Firestore connection with more detailed error handling
import { testFirestoreConnection } from './firebase-utils';
testFirestoreConnection()
  .then(() => {
    console.log('✅ Firestore connection test passed successfully');
  })
  .catch(error => {
    console.error('❌ Firestore connection test failed with error:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  });

export default app;