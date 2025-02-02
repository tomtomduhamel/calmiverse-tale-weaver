import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { corsHandler } from '../middleware/cors';
import { generateStoryWithAI } from '../services/openaiService';

if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = functions.https.onRequest((request, response) => {
  return corsHandler(request, response, async () => {
    if (request.method === 'OPTIONS') {
      response.set('Access-Control-Allow-Origin', '*');
      response.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      response.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      response.set('Access-Control-Max-Age', '86400');
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
      const { objective, childrenNames } = request.body.data;
      console.log('Generating story with prompt:', request.body.data.prompt);

      const storyData = await generateStoryWithAI(objective, childrenNames);
      
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