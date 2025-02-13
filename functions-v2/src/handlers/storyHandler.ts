
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';
import { defineSecret } from 'firebase-functions/params';
import { type CloudFunctionStory } from '../types/shared/story';
import { StoryMetrics } from '../utils/monitoring';

interface StoryGenerationRequest {
  storyId: string;
  objective: string;
  childrenNames: string[];
}

interface StoryGenerationError {
  code: string;
  message: string;
  timestamp: string;
  details?: any;
}

if (!admin.apps.length) {
  admin.initializeApp();
}

const openaiApiKey = defineSecret('OPENAI_API_KEY');

export const generateStory = onCall({
    secrets: [openaiApiKey],
    timeoutSeconds: 540,
    memory: '1GiB',
  }, async (request) => {
    StoryMetrics.startOperation(request.data?.storyId);
    
    try {
      if (!request.auth) {
        const error: StoryGenerationError = {
          code: 'UNAUTHENTICATED',
          message: 'Utilisateur non authentifié',
          timestamp: new Date().toISOString()
        };
        StoryMetrics.logError(request.data?.storyId, new Error(error.message));
        throw new Error(error.message);
      }

      const data = request.data as StoryGenerationRequest;
      console.log('Request data:', {
        storyId: data.storyId,
        objective: data.objective,
        childrenCount: data.childrenNames?.length,
        timestamp: new Date().toISOString()
      });

      const { storyId, objective, childrenNames } = data;
      const authorId = request.auth.uid;

      if (!storyId || !objective || !Array.isArray(childrenNames) || childrenNames.length === 0) {
        const error: StoryGenerationError = {
          code: 'INVALID_ARGUMENTS',
          message: 'Paramètres invalides',
          timestamp: new Date().toISOString(),
          details: { storyId, objective, childrenCount: childrenNames?.length }
        };
        StoryMetrics.logError(storyId, new Error(error.message));
        throw new Error(error.message);
      }

      const apiKey = openaiApiKey.value();
      if (!apiKey) {
        const error: StoryGenerationError = {
          code: 'CONFIGURATION_ERROR',
          message: 'La clé API OpenAI n\'est pas configurée',
          timestamp: new Date().toISOString()
        };
        StoryMetrics.logError(storyId, new Error(error.message));
        throw new Error(error.message);
      }

      const storyRef = admin.firestore().collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();

      if (!storyDoc.exists) {
        const error: StoryGenerationError = {
          code: 'NOT_FOUND',
          message: 'Document d\'histoire non trouvé',
          timestamp: new Date().toISOString(),
          details: { storyId }
        };
        StoryMetrics.logError(storyId, new Error(error.message));
        throw new Error(error.message);
      }

      console.log('Starting OpenAI story generation');
      const generatedStory = await generateStoryWithAI(objective, childrenNames, apiKey);

      console.log('Story generated, updating Firestore');
      
      await admin.firestore().runTransaction(async (transaction) => {
        const storyDoc = await transaction.get(storyRef);
        if (!storyDoc.exists) {
          throw new Error('Story document not found during update');
        }

        const currentData = storyDoc.data();
        const updateData = {
          story_text: generatedStory.story_text,
          preview: generatedStory.preview,
          status: 'completed',
          _version: (currentData?._version || 1) + 1,
          _lastSync: admin.firestore.FieldValue.serverTimestamp(),
          _pendingWrites: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          wordCount: generatedStory.wordCount,
          processingTime: Date.now() - StoryMetrics.getMetrics(storyId)?.startTime,
          retryCount: generatedStory.retryCount || 0
        };

        transaction.update(storyRef, updateData);

        console.log('Story transaction completed:', {
          id: storyId,
          status: 'completed',
          version: updateData._version,
          processingTime: `${updateData.processingTime}ms`,
          retryCount: updateData.retryCount,
          timestamp: new Date().toISOString()
        });
      });

      const updatedDoc = await storyRef.get();
      const finalData = updatedDoc.data() as CloudFunctionStory;

      if (!finalData || finalData.status !== 'completed') {
        const error: StoryGenerationError = {
          code: 'UPDATE_FAILED',
          message: 'La mise à jour du statut de l\'histoire a échoué',
          timestamp: new Date().toISOString(),
          details: { status: finalData?.status }
        };
        StoryMetrics.logError(storyId, new Error(error.message));
        throw new Error(error.message);
      }

      StoryMetrics.endOperation(storyId, 'success');
      
      return {
        ...finalData,
        id: storyId,
        processingTime: StoryMetrics.getMetrics(storyId)?.duration
      };

    } catch (error) {
      StoryMetrics.endOperation(request.data?.storyId, 'error');
      const errorDetails: StoryGenerationError = {
        code: error instanceof Error ? error.name : 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Une erreur inattendue est survenue',
        timestamp: new Date().toISOString(),
        details: {
          processingTime: StoryMetrics.getMetrics(request.data?.storyId)?.duration,
          stack: error instanceof Error ? error.stack : undefined
        }
      };
      
      console.error('Error in generateStory:', errorDetails);
      throw new Error(errorDetails.message);
    }
});
