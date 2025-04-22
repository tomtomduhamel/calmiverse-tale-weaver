
/**
 * Point d'entrée ultra-simple pour Firebase Functions v2
 * Version JavaScript sans dépendance TypeScript
 */

console.log('🏁 Chargement du module functions-v2/index.js...');

// Vérification des modules disponibles
try {
  console.log('📚 Modules disponibles dans node_modules:');
  const fs = require('fs');
  if (fs.existsSync('node_modules')) {
    fs.readdirSync('node_modules').forEach(file => {
      console.log(`- ${file}`);
    });
  } else {
    console.log('❌ Dossier node_modules introuvable');
  }
} catch (fsError) {
  console.error('❌ Erreur lors de la vérification des modules:', fsError);
}

// Importation avec gestion explicite des erreurs
let admin;
try {
  console.log('📦 Importation de firebase-admin...');
  admin = require('firebase-admin');
  console.log('✅ firebase-admin importé avec succès, version:', admin.SDK_VERSION);
} catch (error) {
  console.error('❌ ERREUR CRITIQUE lors de l\'importation de firebase-admin:', error);
  throw new Error(`Impossible d'importer firebase-admin: ${error.message}`);
}

let functions;
try {
  console.log('📦 Importation de firebase-functions...');
  functions = require('firebase-functions');
  console.log('✅ firebase-functions importé avec succès');
} catch (error) {
  console.error('❌ ERREUR CRITIQUE lors de l\'importation de firebase-functions:', error);
  throw new Error(`Impossible d'importer firebase-functions: ${error.message}`);
}

// Initialisation Firebase Admin
try {
  console.log('🔥 Initialisation de Firebase Admin...');
  
  if (!admin.apps.length) {
    admin.initializeApp();
    console.log('✅ Firebase Admin SDK initialisé avec succès');
  } else {
    console.log('ℹ️ Firebase Admin SDK déjà initialisé');
  }
} catch (error) {
  console.error('❌ ERREUR CRITIQUE lors de l\'initialisation de Firebase Admin:', error);
  throw new Error(`Échec de l'initialisation de Firebase Admin: ${error.message}`);
}

// Fonction Ping simple pour valider le déploiement
exports.ping = functions.https.onCall((data, context) => {
  console.log('🟢 Fonction ping appelée avec succès:', { data, authUid: context.auth?.uid });
  
  return {
    status: 'success',
    message: 'pong depuis functions-v2',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    project: process.env.GOOGLE_CLOUD_PROJECT
  };
});

console.log('✅ Module functions-v2/index.js chargé avec succès');
