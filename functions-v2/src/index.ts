
import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { generateStoryWithAI } from './services/openaiService';

// Initialize Firebase Admin
admin.initializeApp();

// Export the Cloud Function
export const generateStory = functions.https.onCall(async (data, context) => {
  try {
    const { objective, childrenNames, apiKey } = data;
    return await generateStoryWithAI(objective, childrenNames, apiKey);
  } catch (error) {
    console.error('Error in generateStory function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
