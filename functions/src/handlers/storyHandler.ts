
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';

export interface StoryGenerationRequest {
  objective: string;
  childrenNames: string[];
}

if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = functions.https.onCall(
  async (request: { data: StoryGenerationRequest }) => {
    try {
      const { objective, childrenNames } = request.data;

      // Validation des données entrantes
      if (!objective) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'L\'objectif est requis'
        );
      }

      if (!Array.isArray(childrenNames)) {
        throw new functions.https.HttpsError(
          'invalid-argument',
          'Les noms des enfants doivent être fournis dans un tableau'
        );
      }

      console.log('Objectif:', objective);
      console.log('Noms des enfants:', childrenNames);

      const storyData = await generateStoryWithAI(objective, childrenNames);
      console.log('Histoire générée:', storyData);
      
      const storyRef = admin.firestore().collection('stories').doc(storyData.id_stories);
      
      await storyRef.set({
        ...storyData,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
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
