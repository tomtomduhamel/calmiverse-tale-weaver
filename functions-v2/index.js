
/**
 * Point d'entrée ultra-minimaliste pour Firebase Functions v2
 * Version VRAIMENT simplifiée avec diagnostic intégré
 */

console.log('🚀 Démarrage de functions-v2/index.js...');
console.log('📂 Répertoire actuel:', __dirname);
console.log('🔍 NODE_PATH:', process.env.NODE_PATH || 'non défini');
console.log('📦 Tentative de charger les modules...');

// Configurer explicitement le chemin des modules si nécessaire
process.env.NODE_PATH = process.env.NODE_PATH || `${__dirname}/node_modules`;
require('module').Module._initPaths();

try {
  // Chargement explicite des modules avec gestion d'erreur
  const admin = require('firebase-admin');
  console.log('✅ Module firebase-admin chargé avec succès');
  
  const functions = require('firebase-functions');
  console.log('✅ Module firebase-functions chargé avec succès');
  
  // Initialisation Firebase Admin
  if (!admin.apps.length) {
    admin.initializeApp();
    console.log('✅ Firebase Admin SDK initialisé');
  }

  // Exporter uniquement la fonction ping (test minimal)
  exports.ping = functions.https.onCall((data, context) => {
    console.log('🟢 Fonction ping appelée');
    return {
      message: 'pong depuis functions-v2 (version ultra-simplifiée)',
      timestamp: new Date().toISOString(),
      diagnostics: {
        dirname: __dirname,
        node_modules_path: process.env.NODE_PATH,
        node_version: process.version
      }
    };
  });

  console.log('✅ Module functions-v2/index.js chargé avec succès');
  
} catch (error) {
  console.error('❌ ERREUR CRITIQUE lors du chargement des modules:', error);
  
  // Tenter de diagnostiquer le problème
  try {
    const fs = require('fs');
    console.error('📁 Contenu du répertoire actuel:', fs.readdirSync('.'));
    console.error('📁 Contenu de node_modules (si existe):', 
      fs.existsSync('./node_modules') ? fs.readdirSync('./node_modules') : 'absent');
      
    if (fs.existsSync('./node_modules/firebase-admin')) {
      console.error('📁 Sous-répertoires de firebase-admin:', fs.readdirSync('./node_modules/firebase-admin'));
    }
  } catch (fsError) {
    console.error('❌ Impossible de lister les fichiers:', fsError);
  }
  
  // Rethrow pour que l'erreur soit visible dans les logs
  throw error;
}
