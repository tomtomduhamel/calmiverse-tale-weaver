import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { corsHandler } from '../middleware/cors';
import { generateStoryWithAI } from '../services/openaiService';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = functions.https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    // Gérer explicitement la requête OPTIONS
    if (request.method === 'OPTIONS') {
      console.log('Requête OPTIONS reçue');
      response.set('Access-Control-Allow-Origin', '*');
      response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.set('Access-Control-Max-Age', '86400');
      response.status(204).send('');
      return;
    }

    try {
      console.log('Début du traitement de la requête POST');
      console.log('Corps de la requête:', JSON.stringify(request.body, null, 2));

      if (!request.body.data?.prompt) {
        console.error('Erreur: prompt manquant dans la requête');
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Le prompt est requis'
        );
      }

      console.log('Données reçues dans la fonction:', JSON.stringify(request.body.data, null, 2));
      const { objective, childrenNames } = request.body.data;
      console.log('Objectif:', objective);
      console.log('Noms des enfants:', childrenNames);

      console.log('Appel du service OpenAI avec les paramètres:', {
        objective,
        childrenNames
      });

      const storyData = await generateStoryWithAI(objective, childrenNames);
      console.log('Réponse du service OpenAI:', JSON.stringify(storyData, null, 2));
      
      console.log('Tentative de mise à jour Firestore pour l\'histoire:', storyData.id_stories);
      const storyRef = admin.firestore().doc(`stories/${storyData.id_stories}`);
      
      const updateData = {
        story_text: storyData.story_text,
        story_summary: storyData.story_summary,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      console.log('Données de mise à jour Firestore:', JSON.stringify(updateData, null, 2));
      await storyRef.update(updateData);
      console.log('Histoire mise à jour dans Firestore avec succès:', storyData.id_stories);
      
      console.log('Préparation de la réponse HTTP');
      response.json({ data: storyData });
      console.log('Réponse HTTP envoyée avec succès');

    } catch (error) {
      console.error('Erreur détaillée lors de la génération de l\'histoire:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace available');
      
      if (error instanceof functions.https.HttpsError) {
        console.log('Erreur HTTP Firebase:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        response.status(400).json({ 
          error: error.message,
          code: error.code,
          details: error.details 
        });
      } else {
        console.error('Erreur non gérée:', error);
        response.status(500).json({ 
          error: 'Failed to generate story',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
});