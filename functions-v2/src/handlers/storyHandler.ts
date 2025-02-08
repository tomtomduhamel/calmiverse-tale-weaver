
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';
import { defineSecret } from 'firebase-functions/params';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

export interface StoryGenerationRequest {
  objective: string;
  childrenNames: string[];
}

const openaiApiKey = defineSecret('OPENAI_API_KEY');

export const generateStory = onCall({
    secrets: [openaiApiKey],
    timeoutSeconds: 540,
    memory: '1GiB',
  }, async (request) => {
    console.log('Starting story generation process');
    
    try {
      const data = request.data as StoryGenerationRequest;
      const { objective, childrenNames } = data;

      if (!objective) {
        console.error('Missing objective in request');
        throw new Error('L\'objectif est requis');
      }

      if (!Array.isArray(childrenNames) || childrenNames.length === 0) {
        console.error('Invalid or empty childrenNames array');
        throw new Error('Les noms des enfants doivent être fournis dans un tableau non vide');
      }

      // Get the API key from the environment
      const apiKey = openaiApiKey.value();
      if (!apiKey) {
        console.error('OpenAI API key is not configured');
        throw new Error('La clé API OpenAI n\'est pas configurée');
      }

      console.log('Request validation passed, proceeding with story generation');
      console.log('Objectif:', objective);
      console.log('Noms des enfants:', childrenNames);

      const storyData = await generateStoryWithAI(objective, childrenNames, apiKey);
      console.log('Story generated successfully:', storyData.id_stories);
      
      const storyRef = admin.firestore().collection('stories').doc(storyData.id_stories);
      
      await storyRef.set({
        ...storyData,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      console.log('Story saved to Firestore:', storyData.id_stories);
      return storyData;

    } catch (error) {
      console.error('Error in generateStory:', error);
      throw new Error(error instanceof Error ? error.message : 'Une erreur inattendue est survenue');
    }
  }
);
