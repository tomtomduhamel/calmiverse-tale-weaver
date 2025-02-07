
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';
import { corsHandler } from '../middleware/cors';

export interface StoryGenerationRequest {
  objective: string;
  childrenNames: string[];
}

if (!admin.apps.length) {
  admin.initializeApp();
}

// Set higher timeout for story generation
const runtimeOpts = {
  timeoutSeconds: 120,
  memory: '1GB'
};

export const generateStory = functions
  .runWith(runtimeOpts)
  .https.onCall(async (request: functions.https.CallableRequest<StoryGenerationRequest>) => {
    return new Promise((resolve, reject) => {
      corsHandler(request.raw, request.raw.res, async () => {
        try {
          const { objective, childrenNames } = request.data;

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
          
          resolve(storyData);

        } catch (error) {
          console.error('Erreur:', error);
          reject(new functions.https.HttpsError(
            'internal',
            'Failed to generate story',
            error instanceof Error ? error.message : 'Unknown error'
          ));
        }
      });
    });
  });

