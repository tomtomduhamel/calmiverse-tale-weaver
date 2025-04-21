
"use strict";

// Importation et initialisation de firebase-admin
const admin = require('firebase-admin');

// Initialisation de Firebase Admin si nécessaire
if (!admin.apps.length) {
  admin.initializeApp();
  console.log('Firebase Admin SDK initialisé avec succès dans functions/lib/index.js');
}

// Importation des handlers
const uploadHandler = require('./handlers/uploadHandler');
const storyHandler = require('./handlers/storyHandler');

// Exports
exports.uploadEpub = uploadHandler.uploadEpub;
exports.generateStory = storyHandler.generateStory;

console.log('functions/lib/index.js chargé avec succès');
