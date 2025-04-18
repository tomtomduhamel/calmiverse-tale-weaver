
import * as admin from 'firebase-admin';
import { uploadEpub } from './handlers/uploadHandler';
import { generateStory } from './handlers/storyHandler';

// Assurez-vous que Firebase Admin est initialisé correctement
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('Firebase Admin SDK initialisé avec succès dans functions/src/index.ts');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
}

// Exporter les fonctions
export {
  uploadEpub,
  generateStory
};

// Ajouter un log pour confirmer que le fichier a été chargé
console.log('functions/src/index.ts chargé avec succès');
