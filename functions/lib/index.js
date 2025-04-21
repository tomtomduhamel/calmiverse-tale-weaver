
"use strict";

// Importation explicite de firebase-admin
try {
  const admin = require('firebase-admin');
  
  // Initialisation de Firebase Admin si nécessaire
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    console.log('Firebase Admin SDK initialisé avec succès dans functions/lib/index.js');
  }
  
  // Importation des handlers
  const uploadHandler = require('./handlers/uploadHandler');
  const storyHandler = require('./handlers/storyHandler');
  
  // Exports
  exports.uploadEpub = uploadHandler.uploadEpub;
  exports.generateStory = storyHandler.generateStory;
  
  console.log('functions/lib/index.js chargé avec succès');
} catch (error) {
  console.error('Erreur critique dans functions/lib/index.js:', error);
  throw error;
}
