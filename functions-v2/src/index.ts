
import * as admin from 'firebase-admin';
import { onCall } from 'firebase-functions/v2/https';

// Handlers des fonctions
import { generateStory } from './handlers/story/generateStoryHandler';
import { retryFailedStory } from './handlers/story/retryStoryHandler';
import { ping } from './handlers/ping';

// Initialiser Firebase Admin (une seule fois)
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('Firebase Admin SDK initialisé');
}

// Exporter les fonctions cloud
export {
  generateStory,
  retryFailedStory,
  ping
};

// Log pour vérifier que le fichier est correctement chargé
console.log('Firebase Functions v2 - Index chargé avec succès');
console.log('Fonctions exportées:', Object.keys({generateStory, retryFailedStory, ping}).join(', '));
