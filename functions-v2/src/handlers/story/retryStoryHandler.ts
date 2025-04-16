
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../../services/ai/story-generator';
import { StoryResponse } from '../types';
import { extractStoryParameters, updateStoryWithErrorStatus } from './storyUtils';

// Function to manually retry failed stories
export const retryFailedStory = onCall(
  {
    timeoutSeconds: 300,
    memory: '2GiB',
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
      let { objective, childrenNames } = extractStoryParameters(storyData);
      
      console.log(`Retrying story generation with:`, {
        objective,
        childrenNames
      });
      
      try {
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
        } as StoryResponse;
      } catch (error) {
        console.error(`Error regenerating story ${storyId}:`, error);
        
        // Update the story with error status
        await updateStoryWithErrorStatus(storyId, error);
        
        throw error;
      }
      
    } catch (error) {
      console.error('Error in retryFailedStory function:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Une erreur est survenue lors de la nouvelle tentative';
      
      throw new Error(errorMessage);
    }
  }
);
