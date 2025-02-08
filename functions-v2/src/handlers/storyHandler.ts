
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

      // Première étape : créer le document avec le statut initial
      const storyInitialData = {
        objective,
        childrenNames,
        status: 'pending',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        title: `Histoire pour ${childrenNames.join(' et ')}`,
        preview: "Histoire en cours de génération...",
        story_text: "Génération en cours...",
        story_summary: "Résumé en cours de génération..."
      };

      const storyRef = admin.firestore().collection('stories').doc();
      console.log('Creating initial story document:', storyRef.id);
      
      await storyRef.set(storyInitialData);
      console.log('Initial story document created successfully');

      // Deuxième étape : génération de l'histoire
      console.log('Starting story generation with OpenAI');
      const generatedStory = await generateStoryWithAI(objective, childrenNames, apiKey);
      console.log('Story generated successfully');

      // Troisième étape : mise à jour du document avec l'histoire générée
      const updateData = {
        story_text: generatedStory.story_text,
        preview: generatedStory.preview,
        status: 'completed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      console.log('Updating story document with generated content');
      await storyRef.update(updateData);

      // Vérification de la mise à jour
      const updatedDoc = await storyRef.get();
      const finalData = updatedDoc.data();

      if (!finalData || finalData.status !== 'completed') {
        console.error('Story status update failed:', {
          id: storyRef.id,
          currentStatus: finalData?.status
        });
        throw new Error('La mise à jour du statut de l\'histoire a échoué');
      }

      console.log('Story document updated successfully:', {
        id: storyRef.id,
        status: finalData.status,
        contentLength: finalData.story_text?.length
      });

      return {
        ...finalData,
        id: storyRef.id
      };

    } catch (error) {
      console.error('Error in generateStory:', error);
      throw new Error(error instanceof Error ? error.message : 'Une erreur inattendue est survenue');
    }
  }
);
