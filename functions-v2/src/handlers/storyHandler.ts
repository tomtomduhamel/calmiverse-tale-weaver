
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../services/openaiService';
import { defineSecret } from 'firebase-functions/params';
import { StoryGenerationRequest, isFirebaseError } from '../types/story';

if (!admin.apps.length) {
  admin.initializeApp();
}

const openaiApiKey = defineSecret('OPENAI_API_KEY');

export const generateStory = onCall({
    secrets: [openaiApiKey],
    timeoutSeconds: 540,
    memory: '1GiB',
  }, async (request) => {
    console.log('Starting story generation process');
    
    try {
      if (!request.auth) {
        throw new Error('Utilisateur non authentifié');
      }

      const data = request.data as StoryGenerationRequest;
      const { storyId, objective, childrenNames } = data;
      const authorId = request.auth.uid;

      if (!storyId) {
        console.error('Missing storyId in request');
        throw new Error('L\'ID de l\'histoire est requis');
      }

      if (!objective) {
        console.error('Missing objective in request');
        throw new Error('L\'objectif est requis');
      }

      if (!Array.isArray(childrenNames) || childrenNames.length === 0) {
        console.error('Invalid or empty childrenNames array');
        throw new Error('Les noms des enfants doivent être fournis dans un tableau non vide');
      }

      const apiKey = openaiApiKey.value();
      if (!apiKey) {
        console.error('OpenAI API key is not configured');
        throw new Error('La clé API OpenAI n\'est pas configurée');
      }

      console.log('Request validation passed:', {
        storyId,
        authorId,
        objective,
        childrenNames
      });

      // Vérifier que le document existe
      const storyRef = admin.firestore().collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();

      if (!storyDoc.exists) {
        throw new Error('Document d\'histoire non trouvé');
      }

      console.log('Starting story generation with OpenAI');
      const generatedStory = await generateStoryWithAI(objective, childrenNames, apiKey);

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
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        transaction.update(storyRef, updateData);

        console.log('Story transaction completed successfully:', {
          id: storyId,
          newStatus: 'completed',
          newVersion: updateData._version
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
        version: finalData._version
      });

      return {
        ...finalData,
        id: storyId
      };

    } catch (error) {
      console.error('Error in generateStory:', error);
      if (isFirebaseError(error)) {
        throw new Error(error.message);
      }
      throw new Error('Une erreur inattendue est survenue');
    }
  }
);
