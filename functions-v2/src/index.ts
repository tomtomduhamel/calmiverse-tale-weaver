
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { generateStoryWithAI } from './services/openaiService';
import { StoryGenerationRequest, isFirebaseError } from './types/story';

// Initialize Firebase Admin
admin.initializeApp();

// Export the Cloud Function
export const generateStory = functions.https.onCall(async (data: StoryGenerationRequest, context) => {
  try {
    const { objective, childrenNames, apiKey } = data;

    if (!objective || !childrenNames || !Array.isArray(childrenNames)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Les paramètres objective et childrenNames sont requis'
      );
    }

    return await generateStoryWithAI(objective, childrenNames, apiKey);
  } catch (error) {
    console.error('Error in generateStory function:', error);
    if (isFirebaseError(error)) {
      throw new functions.https.HttpsError('internal', error.message);
    }
    throw new functions.https.HttpsError('internal', 'Une erreur inattendue est survenue');
  }
});
