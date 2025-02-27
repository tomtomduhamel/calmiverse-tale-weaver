
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

  return {
    createStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration,
  };
};
