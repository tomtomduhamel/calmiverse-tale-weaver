
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';

export interface StoryGenerationRequest {
  objective: string;
  childrenNames: string[];
}

if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = onCall(
  {
    timeoutSeconds: 120,
    memory: '1GB',
  },
  async (request) => {
    try {
      const data = request.data as StoryGenerationRequest;
      const { objective, childrenNames } = data;

      if (!objective) {
        throw new Error('L\'objectif est requis');
      }

      if (!Array.isArray(childrenNames)) {
        throw new Error('Les noms des enfants doivent être fournis dans un tableau');
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
      throw new Error(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);
