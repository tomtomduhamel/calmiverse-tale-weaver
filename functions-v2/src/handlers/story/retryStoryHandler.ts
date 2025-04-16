
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../../services/ai/story-generator';
import { StoryResponse } from '../types';
import { extractStoryParameters, updateStoryWithErrorStatus } from './storyUtils';

/**
 * Fonction pour réessayer la génération d'histoires ayant échoué
 */
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
      
      console.log(`Nouvelle tentative de génération pour l'histoire ID: ${storyId}`);
      
      // Récupérer le document de l'histoire
      const storyRef = admin.firestore().collection('stories').doc(storyId);
      const storyDoc = await storyRef.get();
      
      if (!storyDoc.exists) {
        throw new Error(`Histoire avec l'ID ${storyId} non trouvée`);
      }
      
      const storyData = storyDoc.data();
      
      if (!storyData) {
        throw new Error(`Données de l'histoire manquantes pour ${storyId}`);
      }
      
      // Mettre à jour le statut de l'histoire à "en attente"
      await storyRef.update({
        status: 'pending',
        error: admin.firestore.FieldValue.delete(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      console.log(`Statut de l'histoire ${storyId} mis à jour à "pending" pour une nouvelle tentative`);
      
      // Extraire l'objectif et les noms d'enfants des données de l'histoire
      let { objective, childrenNames } = extractStoryParameters(storyData);
      
      console.log(`Nouvelle tentative de génération avec:`, {
        objective,
        childrenNames
      });
      
      try {
        // Appeler la fonction generateStory avec les données de l'histoire
        const result = await generateStoryWithAI(objective, childrenNames);
        
        // Mettre à jour l'histoire avec le nouveau contenu
        await storyRef.update({
          ...result,
          status: 'completed',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Histoire ${storyId} régénérée avec succès`);
        
        return { 
          success: true, 
          storyData: result 
        } as StoryResponse;
      } catch (error) {
        console.error(`Erreur lors de la régénération de l'histoire ${storyId}:`, error);
        
        // Mettre à jour l'histoire avec le statut d'erreur
        await updateStoryWithErrorStatus(storyId, error);
        
        throw error;
      }
      
    } catch (error) {
      console.error('Erreur dans la fonction retryFailedStory:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Une erreur est survenue lors de la nouvelle tentative';
      
      throw new Error(errorMessage);
    }
  }
);
