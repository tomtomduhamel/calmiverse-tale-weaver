import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';

export interface StoryGenerationRequest {
  storyId?: string;
  objective: string;
  childrenNames: string[];
}

// Initialize Firebase if not already initialized
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
      console.log('Function called with request data:', request.data);
      const data = request.data as StoryGenerationRequest;
      const { storyId, objective, childrenNames } = data;

      if (!objective) {
        console.error('Missing required field: objective');
        throw new Error('L\'objectif est requis');
      }

      if (!Array.isArray(childrenNames)) {
        console.error('Invalid data format: childrenNames must be an array');
        throw new Error('Les noms des enfants doivent être fournis dans un tableau');
      }

      console.log('Processing story generation request:', {
        storyId: storyId || 'Not provided (will be auto-generated)',
        objective,
        childrenNames
      });

      const storyData = await generateStoryWithAI(objective, childrenNames);
      console.log('Story generated successfully:', {
        id: storyData.id_stories,
        title: storyData.title,
        previewLength: storyData.preview?.length,
        storyTextLength: storyData.story_text?.length
      });
      
      // If a storyId is provided, update the existing story
      // Otherwise, the document ID will be auto-generated
      const docRef = storyId 
        ? admin.firestore().collection('stories').doc(storyId)
        : admin.firestore().collection('stories').doc(storyData.id_stories);
      
      console.log(`Updating Firestore document: ${docRef.id}`);
      
      // Atomic update with transaction to avoid race conditions
      await admin.firestore().runTransaction(async (transaction) => {
        // Get the current document if it exists
        const doc = await transaction.get(docRef);
        
        if (storyId && !doc.exists) {
          console.error(`Story with ID ${storyId} not found`);
          throw new Error(`Histoire avec l'ID ${storyId} non trouvée`);
        }
        
        const dataToUpdate = {
          ...storyData,
          status: 'completed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };
        
        if (doc.exists) {
          // Update existing document
          console.log('Updating existing story document');
          transaction.update(docRef, dataToUpdate);
        } else {
          // Create new document
          console.log('Creating new story document');
          transaction.set(docRef, dataToUpdate);
        }
      });
      
      console.log('Firestore update completed successfully');
      return storyData;

    } catch (error) {
      console.error('Error in generateStory function:', error);
      
      // Create a clean error message for the client
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Une erreur inconnue est survenue';
      
      const errorCode = 'STORY_GENERATION_FAILED';
      
      // Log detailed error for debugging
      console.error(`${errorCode}: ${errorMessage}`, error);
      
      // Throw a formatted error
      throw new Error(JSON.stringify({
        code: errorCode,
        message: errorMessage,
        timestamp: new Date().toISOString()
      }));
    }
  }
);
