
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from './services/openaiService';
import { defineSecret } from 'firebase-functions/params';
import { StoryGenerationRequest, isFirebaseError } from './types/story';

if (!admin.apps.length) {
  admin.initializeApp();
}

const openaiApiKey = defineSecret('OPENAI_API_KEY');

export const generateStory = onCall({
  secrets: [openaiApiKey],
  timeoutSeconds: 540,
  memory: '1GiB',
  maxInstances: 10,
}, async (request) => {
  console.log('Starting story generation process with request:', {
    hasAuth: !!request.auth,
    dataPresent: !!request.data,
    timestamp: new Date().toISOString()
  });
  
  try {
    if (!request.auth) {
      console.error('Authentication error: User not authenticated');
      throw new Error('Utilisateur non authentifié');
    }

    const data = request.data as StoryGenerationRequest;
    console.log('Parsed request data:', {
      storyId: data.storyId,
      objective: data.objective,
      childrenCount: data.childrenNames?.length,
      timestamp: new Date().toISOString()
    });

    const { storyId, objective, childrenNames } = data;
    const authorId = request.auth.uid;

    if (!storyId || !objective || !Array.isArray(childrenNames) || childrenNames.length === 0) {
      console.error('Invalid parameters:', { storyId, objective, childrenNames });
      throw new Error('Paramètres invalides');
    }

    // Vérifier que le document existe
    const storyRef = admin.firestore().collection('stories').doc(storyId);
    const storyDoc = await storyRef.get();

    if (!storyDoc.exists) {
      console.error('Story document not found:', storyId);
      throw new Error('Document d\'histoire non trouvé');
    }

    const apiKey = openaiApiKey.value();
    if (!apiKey) {
      console.error('OpenAI API key not configured');
      throw new Error('Clé API OpenAI non configurée');
    }

    console.log('Starting OpenAI story generation');
    const generatedStory = await generateStoryWithAI(objective, childrenNames, apiKey);

    console.log('Story generated successfully, updating Firestore');
    
    // Utiliser une transaction pour la mise à jour
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
        processingTime: generatedStory.processingTime
      };

      transaction.update(storyRef, updateData);

      console.log('Story transaction completed:', {
        id: storyId,
        newStatus: 'completed',
        newVersion: updateData._version,
        wordCount: updateData.wordCount,
        timestamp: new Date().toISOString()
      });
    });

    const updatedDoc = await storyRef.get();
    const finalData = updatedDoc.data();

    if (!finalData || finalData.status !== 'completed') {
      console.error('Story update verification failed:', {
        id: storyId,
        status: finalData?.status,
        authorId: finalData?.authorId
      });
      throw new Error('La mise à jour du statut de l\'histoire a échoué');
    }

    console.log('Story document updated successfully:', {
      id: storyId,
      status: finalData.status,
      authorId: finalData.authorId,
      version: finalData._version,
      wordCount: finalData.wordCount,
      timestamp: new Date().toISOString()
    });

    return {
      ...finalData,
      id: storyId
    };

  } catch (error) {
    console.error('Error in generateStory:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      timestamp: new Date().toISOString()
    });

    if (isFirebaseError(error)) {
      console.error('Firebase error details:', {
        code: error.code,
        message: error.message,
        timestamp: new Date().toISOString()
      });
    }

    throw error;
  }
});
