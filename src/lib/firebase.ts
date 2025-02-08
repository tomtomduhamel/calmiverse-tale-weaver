
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app, 'us-central1');

// Uncomment this line when testing locally with Firebase emulator
// if (process.env.NODE_ENV === 'development') {
//   connectFunctionsEmulator(functions, 'localhost', 5001);
// }

export default app;
