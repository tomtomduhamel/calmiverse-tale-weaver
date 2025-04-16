
import { onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { generateStoryWithAI } from '../../services/ai/story-generator';
import { StoryGenerationRequest, StoryResponse } from '../types';
import { updateStoryWithErrorStatus, createErrorResponse } from './storyUtils';

/**
 * Fonction Cloud pour générer une nouvelle histoire
 */
export const generateStory = onCall(
  {
    timeoutSeconds: 300,
    memory: '2GiB',
    minInstances: 0,
    maxInstances: 10,
    concurrency: 5,
  },
  async (request) => {
    try {
      console.log('Fonction generateStory appelée avec les données:', request.data);
      const data = request.data as StoryGenerationRequest;
      const { storyId, objective, childrenNames } = data;

      // Validation des données requises
      if (!objective) {
        console.error('Champ requis manquant: objective');
        throw new Error('L\'objectif est requis');
      }

      if (!Array.isArray(childrenNames) || childrenNames.length === 0) {
        console.error('Format de données invalide: childrenNames doit être un tableau non vide');
        throw new Error('Les noms des enfants doivent être fournis dans un tableau non vide');
      }

      console.log('Traitement de la demande de génération d\'histoire:', {
        storyId: storyId || 'Non fourni (sera généré automatiquement)',
        objective,
        childrenNames
      });

      try {
        // Générer l'histoire avec OpenAI
        const storyData = await generateStoryWithAI(objective, childrenNames);
        console.log('Histoire générée avec succès:', {
          id: storyData.id_stories,
          titre: storyData.title,
          longueurAperçu: storyData.preview?.length,
          longueurTexte: storyData.story_text?.length
        });
        
        // Si un storyId est fourni, mettre à jour l'histoire existante
        // Sinon, l'ID du document sera généré automatiquement
        const docRef = storyId 
          ? admin.firestore().collection('stories').doc(storyId)
          : admin.firestore().collection('stories').doc(storyData.id_stories);
        
        console.log(`Mise à jour du document Firestore: ${docRef.id}`);
        
        // Mise à jour atomique avec transaction pour éviter les conditions de course
        await admin.firestore().runTransaction(async (transaction) => {
          // Obtenir le document actuel s'il existe
          const doc = await transaction.get(docRef);
          
          if (storyId && !doc.exists) {
            console.error(`Histoire avec l'ID ${storyId} non trouvée`);
            throw new Error(`Histoire avec l'ID ${storyId} non trouvée`);
          }
          
          const dataToUpdate = {
            ...storyData,
            status: 'completed',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          };
          
          if (doc.exists) {
            // Mettre à jour le document existant
            console.log('Mise à jour du document d\'histoire existant');
            transaction.update(docRef, dataToUpdate);
          } else {
            // Créer un nouveau document
            console.log('Création d\'un nouveau document d\'histoire');
            transaction.set(docRef, dataToUpdate);
          }
        });
        
        console.log('Mise à jour Firestore terminée avec succès');
        
        // Retourner une réponse standardisée avec les données de l'histoire générée
        return { 
          success: true, 
          storyData: storyData 
        } as StoryResponse;
      } catch (error) {
        console.error('Erreur lors de la génération de l\'histoire:', error);
        
        // Mettre à jour l'histoire avec le statut d'erreur
        if (storyId) {
          await updateStoryWithErrorStatus(storyId, error);
        }
        
        throw error;
      }
    } catch (error) {
      console.error('Erreur dans la fonction generateStory:', error);
      
      // Lancer une erreur formatée
      throw new Error(createErrorResponse(error));
    }
  }
);
