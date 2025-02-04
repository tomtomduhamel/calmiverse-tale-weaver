import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { corsHandler } from '../middleware/cors';
import { generateStoryWithAI } from '../services/openaiService';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = functions.https.onRequest((request, response) => {
  // Ajout des headers CORS avant toute chose
  response.set('Access-Control-Allow-Origin', '*');
  response.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.set('Access-Control-Max-Age', '3600');

  // Gérer la requête OPTIONS immédiatement
  if (request.method === 'OPTIONS') {
    response.status(204).send('');
    return;
  }

  // Utiliser le middleware CORS
  return corsHandler(request, response, async () => {
    try {
      console.log('Corps de la requête:', request.body);
      
      if (!request.body.data?.prompt) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Le prompt est requis'
        );
      }

      const { objective, childrenNames } = request.body.data;
      console.log('Objectif:', objective);
      console.log('Noms des enfants:', childrenNames);

      const storyData = await generateStoryWithAI(objective, childrenNames);
      console.log('Histoire générée:', storyData);
      
      const storyRef = admin.firestore().doc(`stories/${storyData.id_stories}`);
      
      await storyRef.update({
        story_text: storyData.story_text,
        story_summary: storyData.story_summary,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      response.json({ data: storyData });

    } catch (error) {
      console.error('Erreur:', error);
      
      if (error instanceof functions.https.HttpsError) {
        response.status(400).json({ 
          error: error.message,
          code: error.code,
          details: error.details 
        });
      } else {
        response.status(500).json({ 
          error: 'Failed to generate story',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  });
});