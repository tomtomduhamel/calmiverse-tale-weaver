
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

  const createStory = useCallback(async (formData, children = []) => {
    try {
      console.log('Creating story with data:', formData);
      return await createStoryBase(formData, children);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      console.error('Error creating story:', error);
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [createStoryBase, toast]);

  const retryStory = useCallback(async (storyId) => {
    try {
      console.log('Retrying story generation for story ID:', storyId);
      if (!storyId) {
        throw new Error("ID d'histoire manquant");
      }
      const result = await retryStoryGeneration(storyId);
      return result;
    } catch (error) {
      console.error('Error retrying story generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de la relance de génération';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [retryStoryGeneration, toast]);

  return {
    createStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration: retryStory,
  };
};
