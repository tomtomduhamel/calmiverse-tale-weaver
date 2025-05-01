
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryUpdate } from './useStoryUpdate';
import { useStoryDeletion } from './useStoryDeletion';
import { useStoryCreation } from './useStoryCreation';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';

export const useStoryMutations = () => {
  const { createStory: createStoryBase } = useStoryCreation();
  const { deleteStory } = useStoryDeletion();
  const { updateStoryStatus } = useStoryUpdate();
  const { retryStoryGeneration } = useStoryCloudFunctions();
  const { toast } = useToast();

  const createStory = useCallback(async (formData: any, children = []) => {
    try {
      console.log('Creating story with data:', formData);
      
      // Validation des données d'entrée
      if (!formData || !formData.childrenIds || formData.childrenIds.length === 0) {
        throw new Error("Données d'entrée invalides: sélectionnez au moins un enfant");
      }
      
      if (!formData.objective) {
        throw new Error("Veuillez spécifier un objectif pour l'histoire");
      }
      
      const result = await createStoryBase(formData, children);
      console.log('Story creation result:', result);
      
      if (!result) {
        throw new Error("Aucun résultat retourné par la fonction de création d'histoire");
      }
      
      return result && result.storyId ? result.storyId : null;
    } catch (error: any) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Une erreur inattendue est survenue lors de la création de l'histoire";
      
      console.error('Error creating story:', error);
      
      // Afficher un message d'erreur plus détaillé
      toast({
        title: 'Erreur de création',
        description: `${errorMessage}. Veuillez réessayer.`,
        variant: 'destructive',
      });
      
      // Remonter l'erreur pour que les composants parents puissent réagir
      throw error;
    }
  }, [createStoryBase, toast]);

  const retryStory = useCallback(async (storyId: string) => {
    try {
      console.log('Retrying story generation for story ID:', storyId);
      
      if (!storyId) {
        throw new Error("ID d'histoire manquant");
      }
      
      // Mettre à jour le statut de l'histoire en "pending" avant de relancer
      await updateStoryStatus(storyId, 'pending');
      
      // Appel à la fonction Edge avec gestion des erreurs améliorée
      const result = await retryStoryGeneration(storyId);
      
      if (!result) {
        throw new Error("La relance a échoué: aucune donnée n'a été retournée");
      }
      
      toast({
        title: "Succès",
        description: "L'histoire a été générée avec succès",
      });
      
      return result;
    } catch (error: any) {
      console.error('Error retrying story generation:', error);
      
      // Mettre à jour le statut de l'histoire en "error"
      try {
        await updateStoryStatus(storyId, 'error', error.message || "Erreur lors de la relance");
      } catch (updateError) {
        console.error('Failed to update story status after error:', updateError);
      }
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Échec de la relance de génération pour une raison inconnue';
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [retryStoryGeneration, updateStoryStatus, toast]);

  return {
    createStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration: retryStory,
  };
};
