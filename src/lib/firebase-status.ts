
import { db, auth, functions, storage } from './firebase';

/**
 * Vérifie le statut de la connexion Firebase
 * @returns Un objet contenant l'état de connexion de chaque service Firebase
 */
export const checkFirebaseStatus = async () => {
  const status = {
    firestore: false,
    auth: false,
    functions: false,
    storage: false,
    error: null
  };

  try {
    // Vérifier Firestore
    try {
      const testCollection = db.collection('_status_check');
      await testCollection.doc('test').set({ timestamp: new Date() });
      await testCollection.doc('test').delete();
      status.firestore = true;
    } catch (error) {
      console.error('Erreur de test Firestore:', error);
    }

    // Vérifier Auth
    status.auth = !!auth;

    // Vérifier Functions
    try {
      // Ping simple pour vérifier la disponibilité
      const pingFunction = functions.httpsCallable('ping');
      await pingFunction();
      status.functions = true;
    } catch (error) {
      if (error.code === 'functions/not-found') {
        // La fonction ping n'existe pas, mais Firebase Functions est disponible
        status.functions = true;
      } else {
        console.error('Erreur de test Functions:', error);
      }
    }

    // Vérifier Storage
    try {
      const testRef = storage.ref('_status_check/test.txt');
      await testRef.putString('test');
      await testRef.delete();
      status.storage = true;
    } catch (error) {
      console.error('Erreur de test Storage:', error);
    }

    return status;
  } catch (error) {
    console.error('Erreur lors de la vérification du statut Firebase:', error);
    status.error = error.message;
    return status;
  }
};

/**
 * Affiche le statut Firebase dans la console
 */
export const logFirebaseStatus = async () => {
  console.log('Vérification du statut Firebase...');
  const status = await checkFirebaseStatus();
  console.log('Statut Firebase:', status);
  
  // Afficher dans un format plus lisible
  console.table({
    'Firestore Database': status.firestore ? '✅ Connected' : '❌ Disconnected',
    'Authentication': status.auth ? '✅ Available' : '❌ Unavailable',
    'Cloud Functions': status.functions ? '✅ Connected' : '❌ Disconnected',
    'Cloud Storage': status.storage ? '✅ Connected' : '❌ Disconnected'
  });
  
  return status;
};
