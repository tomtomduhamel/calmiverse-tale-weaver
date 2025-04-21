
import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

// Initialiser Firebase Admin (une seule fois)
try {
  if (!admin.apps.length) {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialisé avec succès dans functions-v2/src/index.ts');
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
}

// Import des handlers de fonctions
import { generateStory } from './handlers/story/generateStoryHandler';
import { retryFailedStory } from './handlers/story/retryStoryHandler';
import { ping } from './handlers/ping';

// Exporter les fonctions cloud
export {
  generateStory,
  retryFailedStory,
  ping
};

// Log pour vérifier que le fichier est correctement chargé
console.log('Firebase Functions v2 - Index chargé avec succès');
console.log('Fonctions exportées:', Object.keys({generateStory, retryFailedStory, ping}).join(', '));
