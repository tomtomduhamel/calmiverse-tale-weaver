import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: "AIzaSyCVFRZKBvJEMB6mXbdWB3h_oJTSb-VstdE",
  authDomain: "calmi-99482.firebaseapp.com",
  projectId: "calmi-99482",
  storageBucket: "calmi-99482.appspot.com",
  messagingSenderId: "811759661179",
  appId: "1:811759661179:web:0dc8e3609f4ea0972a72de",
  measurementId: "G-T4WEMQLSMZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log('Firebase initialized with project ID:', firebaseConfig.projectId);

// Initialize Firestore with persistence disabled
export const db = getFirestore(app);
console.log('Firestore initialized');

// Initialize Auth
export const auth = getAuth(app);
console.log('Auth initialized');

// Initialize Analytics only in production
export const analytics = process.env.NODE_ENV === 'production' ? getAnalytics(app) : null;
console.log('Analytics initialization attempted');

// Use emulators in development
if (process.env.NODE_ENV === 'development') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
}

export default app;