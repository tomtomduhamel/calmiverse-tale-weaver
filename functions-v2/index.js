
/**
 * Entrée principale pour Firebase Functions v2
 * Version ultra-simplifiée pour diagnostiquer les problèmes de déploiement
 */

console.log('🚀 Démarrage du module functions-v2/index.js...');

// Récupération explicite des modules
const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Initialisation Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('✅ Firebase Admin SDK initialisé');
}

// Fonction Ping de base (pour tester le déploiement)
exports.ping = functions.https.onCall((data, context) => {
  console.log('🟢 Fonction ping appelée');
  return {
    message: 'pong depuis functions-v2 (version simplifiée)',
    timestamp: new Date().toISOString()
  };
});

console.log('✅ Module functions-v2/index.js chargé avec succès');
