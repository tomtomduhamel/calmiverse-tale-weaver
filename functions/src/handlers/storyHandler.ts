
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';

interface StoryGenerationRequest {
  objective: string;
  childrenNames: string[];
}

if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = functions.https.onCall(
  async (data: StoryGenerationRequest, context) => {
    try {
      console.log('Données reçues:', data);
      
      if (!data?.objective) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'L\'objectif est requis'
        );
      }

      const { objective, childrenNames } = data;
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
      
      return storyData;

    } catch (error) {
      console.error('Erreur:', error);
      throw new functions.https.HttpsError(
        'internal',
        'Failed to generate story',
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  }
);
