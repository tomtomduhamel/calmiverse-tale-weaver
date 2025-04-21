
/**
 * Point d'entrée CommonJS pour Firebase Functions v2.
 * Ce fichier remplace complètement l'approche TypeScript pour plus de fiabilité.
 */

// Imports essentiels
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { OpenAI } = require('openai');
const cors = require('cors')({ origin: true });

// Initialisation de Firebase Admin
try {
  if (!admin.apps.length) {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialisé avec succès');
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
}

// Fonction Ping simple pour tester le déploiement
exports.ping = functions.https.onCall(async (data, context) => {
  console.log('Fonction ping appelée');
  return {
    status: 'success',
    message: 'pong via CommonJS!',
    timestamp: new Date().toISOString()
  };
});

// Fonction pour réessayer une génération d'histoire
exports.retryFailedStory = functions.https.onCall(async (data, context) => {
  try {
    // Vérifier les paramètres
    if (!data || !data.storyId) {
      throw new Error('ID d\'histoire manquant');
    }
    
    const storyId = data.storyId;
    console.log(`Tentative de régénération de l'histoire: ${storyId}`);
    
    // Récupérer les données de l'histoire depuis Firestore
    const storyRef = admin.firestore().collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();
    
    if (!storyDoc.exists) {
      throw new Error('Histoire non trouvée');
    }
    
    const storyData = storyDoc.data();
    console.log('Données de l\'histoire récupérées:', { id: storyId });
    
    // Mettre à jour le statut de l'histoire
    await storyRef.update({
      status: 'pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Statut de l\'histoire mis à jour en "pending"');
    
    // La vraie génération serait ici
    // Pour simplifier, on simule juste une réussite basique
    
    return {
      success: true,
      message: 'Régénération lancée avec succès',
      storyId: storyId
    };
  } catch (error) {
    console.error('Erreur lors de la régénération:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue'
    };
  }
});

// Version simplifiée de la génération d'histoire
exports.generateStory = functions.https.onCall(async (data, context) => {
  try {
    // Vérifier les paramètres
    if (!data || !data.storyId || !data.objective || !data.childrenNames) {
      throw new Error('Paramètres manquants');
    }
    
    const { storyId, objective, childrenNames } = data;
    console.log(`Génération d'histoire: ${storyId}`, { objective, childrenNames });
    
    // Mettre à jour le statut
    const storyRef = admin.firestore().collection('stories').doc(storyId);
    
    // La vraie génération serait ici
    // Pour simplifier, on simule juste une histoire basique
    const storyData = {
      story_text: `Il était une fois ${childrenNames.join(' et ')}. Ils avaient pour objectif: ${objective}. Et ils vécurent heureux pour toujours!`,
      story_summary: `Une histoire sur ${childrenNames.join(' et ')} qui ${objective}`,
      title: `L'aventure de ${childrenNames[0]}`,
      preview: 'Début de l\'histoire...',
      status: 'completed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };
    
    // Mise à jour dans Firestore
    await storyRef.update(storyData);
    console.log('Histoire générée et enregistrée:', { id: storyId });
    
    return {
      success: true,
      storyId: storyId,
      storyData: storyData
    };
  } catch (error) {
    console.error('Erreur lors de la génération:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue'
    };
  }
});

// Confirmer que le module est chargé
console.log('Module de fonctions v2 CommonJS chargé avec succès!');
