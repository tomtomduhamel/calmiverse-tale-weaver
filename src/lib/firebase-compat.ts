
/**
 * Module de compatibilité pour la migration Firebase -> Supabase
 * 
 * Ce fichier permet de maintenir la compatibilité avec le code existant pendant la migration
 * de Firebase vers Supabase. Il redirige certaines opérations Firebase vers Supabase.
 */

import { initializeApp } from 'firebase/app';
import { initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';
import { supabase } from './supabase';

console.warn(
  "ATTENTION: Vous utilisez encore les API Firebase, qui sont en cours de migration vers Supabase.\n" +
  "Veuillez mettre à jour votre code pour utiliser les hooks Supabase dès que possible."
);

// Configuration Firebase utilisant les variables d'environnement Vite
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCVFRZKBvJEMB6mXbdWB3h_oJTSb-VstdE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "calmi-99482.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "calmi-99482",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "calmi-99482.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "811759661179",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:811759661179:web:0dc8e3609f4ea0972a72de",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-T4WEMQLSMZ"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore with enhanced settings
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  console.error("Erreur lors de l'activation de la persistence:", err);
});

export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Connect to Firebase emulator in development mode
if (import.meta.env.DEV) {
  try {
    connectFunctionsEmulator(functions, 'localhost', 5001);
    console.log('Connected to Firebase Functions emulator');
  } catch (error) {
    console.warn('Failed to connect to Firebase emulator:', error);
  }
}

export default app;
