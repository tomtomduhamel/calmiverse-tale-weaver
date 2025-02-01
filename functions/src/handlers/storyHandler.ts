import * as functions from 'firebase-functions';
import { corsHandler } from '../middleware/cors';
import { generateStoryWithAI } from '../services/openaiService';

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