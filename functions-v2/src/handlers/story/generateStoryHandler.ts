import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../../services/ai/story-generator';
import { StoryGenerationRequest, StoryResponse } from '../types';
import { updateStoryWithErrorStatus, createErrorResponse } from './storyUtils';

export const generateStory = onCall(
  {
    timeoutSeconds: 300, // Increased timeout for longer stories
    memory: '2GiB',       // Increased memory
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
        } as StoryResponse;
      } catch (error: any) {
        console.error('Error generating story:', error);
        
        // Update the story with error status
        if (storyId) {
          await updateStoryWithErrorStatus(storyId, error);
        }
        
        throw error;
      }
    } catch (error: any) {
      console.error('Error in generateStory function:', error);
      
      // Throw a formatted error
      throw new Error(createErrorResponse(error));
    }
  }
);
