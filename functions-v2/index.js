
/**
 * Module ultra-simplifié pour Firebase Functions v2
 * Configuration minimaliste JavaScript pur
 */

console.log('🚀 Démarrage du module functions-v2/index.js...');

// Importer les modules essentiels
let admin;
let functions;

try {
  admin = require('firebase-admin');
  console.log('✅ Module firebase-admin chargé avec succès');
} catch (err) {
  console.error('❌ ERREUR CRITIQUE: Impossible de charger firebase-admin:', err);
  console.error('📁 Contenu du répertoire actuel:', require('fs').readdirSync('.'));
  console.error('📁 Contenu du répertoire node_modules (si existe):', 
    require('fs').existsSync('./node_modules') ? require('fs').readdirSync('./node_modules') : 'absent');
  throw new Error(`Module firebase-admin introuvable: ${err.message}`);
}

try {
  functions = require('firebase-functions');
  console.log('✅ Module firebase-functions chargé avec succès');
} catch (err) {
  console.error('❌ ERREUR CRITIQUE: Impossible de charger firebase-functions:', err);
  throw new Error(`Module firebase-functions introuvable: ${err.message}`);
}

// Initialisation simplifiée de Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('✅ Firebase Admin SDK initialisé');
}

// Fonction Ping ultra-simple (aucune logique complexe)
exports.ping = functions.https.onCall((data, context) => {
  console.log('🟢 Fonction ping appelée');
  return {
    message: 'pong depuis functions-v2',
    timestamp: new Date().toISOString()
  };
});

console.log('✅ Module functions-v2/index.js chargé avec succès');
