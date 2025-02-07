
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';

// Define the base type for the request data
export interface StoryGenerationRequest {
  data: {
    objective: string;
    childrenNames: string[];
  };
}

if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateStory = functions.https.onCall(async (data: StoryGenerationRequest['data'], context) => {
  try {
    // Validation des données entrantes
    if (!data?.objective) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'L\'objectif est requis'
      );
    }

    if (!Array.isArray(data.childrenNames)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Les noms des enfants doivent être fournis dans un tableau'
      );
    }

    const { objective, childrenNames } = data;
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
});
