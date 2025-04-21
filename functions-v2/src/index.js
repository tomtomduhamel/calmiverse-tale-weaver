
/**
 * Point d'entrée minimal CommonJS pour tester Firebase Functions v2.
 * Utilise require() et évite TypeScript/ESM.
 */

// Import classique
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialisation Firebase Admin s'il n'est pas déjà initialisé
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('Firebase Admin SDK initialisé depuis index.js');
}

// Fonction de test expresse (https callable)
exports.ping = functions.https.onCall(async (data, context) => {
  console.log('Fonction ping appelée');
  return {
    status: 'success',
    message: 'pong via CommonJS !',
    timestamp: new Date().toISOString()
  };
});

console.log('index.js CommonJS chargé et prêt !');
