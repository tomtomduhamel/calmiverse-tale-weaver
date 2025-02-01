import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { corsHandler } from '../middleware/cors';
import { generateStoryWithAI } from '../services/openaiService';

// Initialisation de Firebase Admin si ce n'est pas déjà fait
if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = functions.https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    if (request.method === 'OPTIONS') {
      response.status(204).send('');
      return;
    }

    try {
      if (!request.body.data?.prompt) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Le prompt est requis'
        );
      }

      console.log('Données reçues dans la fonction:', request.body.data);
      console.log('Generating story with prompt:', request.body.data.prompt);
      const { objective, childrenNames } = request.body.data;

      const storyData = await generateStoryWithAI(objective, childrenNames);
      
      // Mise à jour du document dans Firestore avec plus de logs
      console.log('Tentative de mise à jour Firestore pour l\'histoire:', storyData.id_stories);
      const storyRef = admin.firestore().doc(`stories/${storyData.id_stories}`);
      
      const updateData = {
        story_text: storyData.story_text,
        story_summary: storyData.story_summary,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      console.log('Données de mise à jour:', updateData);
      await storyRef.update(updateData);
      console.log('Histoire mise à jour dans Firestore avec succès:', storyData.id_stories);
      
      response.json({ data: storyData });

    } catch (error) {
      console.error('Error generating story:', error);
      
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