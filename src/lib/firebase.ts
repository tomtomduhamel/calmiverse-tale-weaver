
import { initializeApp } from 'firebase/app';
import { initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getFunctions, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: "AIzaSyCVFRZKBvJEMB6mXbdWB3h_oJTSb-VstdE",
  authDomain: "calmi-99482.firebaseapp.com",
  projectId: "calmi-99482",
  storageBucket: "calmi-99482.appspot.com",
  messagingSenderId: "811759661179",
  appId: "1:811759661179:web:0dc8e3609f4ea0972a72de",
  measurementId: "G-T4WEMQLSMZ"
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

// Connect to Firebase emulators in development mode
if (process.env.NODE_ENV === 'development') {
  console.log('Initialisation des émulateurs Firebase...');
  
  // Connect to Functions emulator
  console.log('Connexion à l\'émulateur Functions sur le port 5001');
  connectFunctionsEmulator(functions, 'localhost', 5001);
  
  // Connect to Auth emulator
  console.log('Connexion à l\'émulateur Auth sur le port 9099');
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  
  // Connect to Storage emulator
  console.log('Connexion à l\'émulateur Storage sur le port 9199');
  connectStorageEmulator(storage, 'localhost', 9199);
}

export default app;
