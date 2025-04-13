
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

export interface StoryGenerationRequest {
  storyId?: string;
  objective: string;
  childrenNames: string[];
}

// Initialize Firebase if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize Secret Manager client
const secretClient = new SecretManagerServiceClient();

export const generateStory = onCall(
  {
    timeoutSeconds: 300, // Increased timeout for longer stories
    memory: '2GB',       // Increased memory
    minInstances: 0,
    maxInstances: 10,
    concurrency: 5,
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

      if (!Array.isArray(childrenNames) || childrenNames.length === 0) {
        console.error('Invalid data format: childrenNames must be a non-empty array');
        throw new Error('Les noms des enfants doivent être fournis dans un tableau non vide');
      }

      console.log('Processing story generation request:', {
        storyId: storyId || 'Not provided (will be auto-generated)',
        objective,
        childrenNames
      });

      try {
        // Generate the story using OpenAI
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
        
        // Return a standardized response with the generated story data
        return { 
          success: true, 
          storyData: storyData 
        };
      } catch (error: any) {
        console.error('Error generating story:', error);
        
        // Update the story with error status
        if (storyId) {
          try {
            await admin.firestore().collection('stories').doc(storyId).update({
              status: 'error',
              error: error instanceof Error ? error.message : 'Failed to generate story content',
              updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log(`Updated story ${storyId} with error status`);
          } catch (updateError) {
            console.error('Error updating story with error status:', updateError);
          }
        }
        
        throw error;
      }
    } catch (error: any) {
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

// Function to manually retry failed stories
export const retryFailedStory = onCall(
  {
    timeoutSeconds: 300,
    memory: '2GB',
  },
  async (request) => {
    try {
      const { storyId } = request.data;
      
      if (!storyId) {
        throw new Error('L\'identifiant de l\'histoire est requis');
      }
      
      console.log(`Retrying story generation for story ID: ${storyId}`);
      
      // Get the story document
      const storyRef = admin.firestore().collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();
      
      if (!storyDoc.exists) {
        throw new Error(`Histoire avec l'ID ${storyId} non trouvée`);
      }
      
      const storyData = storyDoc.data();
      
      if (!storyData) {
        throw new Error(`Données de l'histoire manquantes pour ${storyId}`);
      }
      
      // Update story status to pending
      await storyRef.update({
        status: 'pending',
        error: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Updated story ${storyId} status to pending for retry`);
      
      // Extract objective and childrenNames from story data
      let objective: string;
      let childrenNames: string[] = [];
      
      if (typeof storyData.objective === 'string') {
        objective = storyData.objective;
      } else if (storyData.objective && typeof storyData.objective === 'object' && 'value' in storyData.objective) {
        objective = storyData.objective.value;
      } else {
        throw new Error(`Format d'objectif invalide pour l'histoire ${storyId}`);
      }
      
      if (Array.isArray(storyData.childrenNames)) {
        childrenNames = storyData.childrenNames;
      }
      
      console.log(`Retrying story generation with:`, {
        objective,
        childrenNames
      });
      
      // Call generateStory function with the story data
      const result = await generateStoryWithAI(objective, childrenNames);
      
      // Update the story with the new content
      await storyRef.update({
        ...result,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Successfully regenerated story ${storyId}`);
      
      return { 
        success: true, 
        storyData: result 
      };
      
    } catch (error: any) {
      console.error('Error in retryFailedStory function:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Une erreur est survenue lors de la nouvelle tentative';
      
      throw new Error(errorMessage);
    }
  }
);
