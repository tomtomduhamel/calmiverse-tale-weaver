
/**
 * Point d'entrée ultra-simplifié pour Firebase Functions v2
 * Version totalement JavaScript, sans TypeScript
 */

// Imports essentiels
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

// Initialisation de Firebase Admin avec logs détaillés
try {
  console.log('Tentative d\'initialisation de Firebase Admin...');
  
  if (!admin.apps.length) {
    console.log('Aucune app Firebase existante, initialisation...');
    admin.initializeApp();
    console.log('✅ Firebase Admin SDK initialisé avec succès');
  } else {
    console.log('✅ Firebase Admin SDK déjà initialisé');
  }
} catch (error) {
  console.error('❌ ERREUR lors de l\'initialisation de Firebase Admin:', error);
}

// Affichage de toutes les variables d'environnement (sans les secrets)
console.log('Variables d\'environnement importantes:', {
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
  NODE_ENV: process.env.NODE_ENV,
  FUNCTION_TARGET: process.env.FUNCTION_TARGET,
  FUNCTION_SIGNATURE_TYPE: process.env.FUNCTION_SIGNATURE_TYPE,
  FUNCTION_NAME: process.env.FUNCTION_NAME
});

// Fonction Ping simple pour tester le déploiement
exports.ping = functions.https.onCall(async (data, context) => {
  console.log('🟢 Fonction ping appelée', { data, authUid: context.auth?.uid });
  
  try {
    return {
      status: 'success',
      message: 'pong depuis la version JavaScript simplifiée!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      project: process.env.GOOGLE_CLOUD_PROJECT
    };
  } catch (error) {
    console.error('❌ Erreur dans la fonction ping:', error);
    return {
      status: 'error',
      message: error.message || 'Erreur inconnue',
      timestamp: new Date().toISOString()
    };
  }
});

console.log('✅ Module index.js ultra-simplifié chargé');
