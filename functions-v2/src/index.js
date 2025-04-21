
/**
 * Point d'entrée CommonJS pour Firebase Functions v2 - version ultra logguée.
 */

// Imports essentiels
const admin = require('firebase-admin');
const functions = require('firebase-functions');
const cors = require('cors')({ origin: true });

// Initialisation de Firebase Admin
try {
  if (!admin.apps.length) {
    admin.initializeApp();
    console.log('Firebase Admin SDK initialisé avec succès');
  } else {
    console.log('Firebase Admin SDK déjà initialisé');
  }
} catch (error) {
  console.error('Erreur lors de l\'initialisation de Firebase Admin:', error);
}

// Affichage partiel des variables d'environnement (hors secrets)
console.log('Variables d\'environnement importantes :', {
  GOOGLE_CLOUD_PROJECT: process.env.GOOGLE_CLOUD_PROJECT,
  NODE_ENV: process.env.NODE_ENV,
});

// Fonction Ping simple pour vérifier l’état général
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
  console.log('=== ➡️ Appel retryFailedStory reçu ===');
  try {
    console.log('- Entrée data:', data);
    console.log('- Contexte de l\'appel:', context.auth ? `UID: ${context.auth.uid}` : 'Pas de contexte auth');

    // Vérifier les paramètres
    if (!data || !data.storyId) {
      console.error('⛔️ Paramètre storyId manquant');
      throw new Error('ID d\'histoire manquant');
    }

    const storyId = data.storyId;
    console.log(`- Tentative de régénération de l'histoire: ${storyId}`);

    // Récupérer les données de l'histoire depuis Firestore
    const storyRef = admin.firestore().collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      console.error(`⛔️ Document story ${storyId} non trouvé dans Firestore`);
      throw new Error('Histoire non trouvée');
    }

    const storyData = storyDoc.data();
    console.log('- Données de l\'histoire récupérées:', {
      id: storyId,
      ...storyData
    });

    // Mettre à jour le statut de l'histoire
    await storyRef.update({
      status: 'pending',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log('- Statut de l\'histoire mis à jour en "pending"');

    // La vraie génération serait ici (simulation seulement)
    return {
      success: true,
      message: 'Régénération lancée avec succès',
      storyId: storyId,
      debug: 'retryFailedStory terminé correctement'
    };
  } catch (error) {
    console.error('❌ Erreur lors de la régénération d\'histoire:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
      stack: error.stack ? error.stack.split('\n').slice(0,3).join('; ') : undefined
    };
  }
});

// Version détaillée de la génération d'histoire
exports.generateStory = functions.https.onCall(async (data, context) => {
  console.log('=== ➡️ Appel generateStory reçu ===');
  try {
    console.log('- Entrée data:', data);
    console.log('- Contexte de l\'appel:', context.auth ? `UID: ${context.auth.uid}` : 'Pas de contexte auth');

    // Vérifier les paramètres
    if (!data || !data.objective || !data.childrenNames) {
      console.error('⛔️ Paramètres manquants:', {
        data
      });
      throw new Error('Paramètres manquants');
    }

    const { storyId, objective, childrenNames } = data;

    // Générer un ID si non fourni
    const actualStoryId = storyId || admin.firestore().collection('stories').doc().id;
    console.log(`- Utilisation de l'ID d'histoire: ${actualStoryId}`);

    // Simuler la "génération d'histoire"
    const storyData = {
      story_text: `Il était une fois ${childrenNames.join(' et ')}. Ils avaient pour objectif: ${objective}. Et ils vécurent heureux pour toujours!`,
      story_summary: `Une histoire sur ${childrenNames.join(' et ')} qui ${objective}`,
      title: `L'aventure de ${childrenNames[0]}`,
      preview: 'Début de l\'histoire...',
      status: 'completed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    // Mise à jour dans Firestore avec logs à chaque étape
    try {
      console.log('- Tentative d\'écriture Firestore sur stories/', actualStoryId);
      await admin.firestore().collection('stories').doc(actualStoryId).set({
        ...storyData,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      console.log('- Écriture dans Firestore terminée');
    } catch (firestoreError) {
      console.error('❌ Erreur Firestore lors de l\'écriture:', firestoreError);
      throw new Error(`Firestore error: ${firestoreError.message}`);
    }

    // Vérification en relisant le doc
    try {
      const écritDoc = await admin.firestore().collection('stories').doc(actualStoryId).get();
      if (!écritDoc.exists) {
        console.warn('- ⚠️ Document pas retrouvé après écriture.');
      } else {
        console.log('- Document retrouvé, données:', écritDoc.data());
      }
    } catch (readAgainError) {
      console.error('❌ Erreur lors de la relecture du document:', readAgainError);
    }

    console.log('- Histoire générée et enregistrée avec succès');

    return {
      success: true,
      storyId: actualStoryId,
      storyData: storyData,
      debug: 'generateStory terminé correctement'
    };
  } catch (error) {
    console.error('❌ Erreur lors de la génération d\'histoire:', error);
    return {
      success: false,
      error: error.message || 'Erreur inconnue',
      stack: error.stack ? error.stack.split('\n').slice(0,3).join('; ') : undefined
    };
  }
});

console.log('Module de fonctions v2 CommonJS chargé avec logs détaillés !');
