
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryCreation } from './useStoryCreation';
import { useStoryDeletion } from './useStoryDeletion';
import { useStoryUpdate } from './useStoryUpdate';
import { useStoryRetry } from './useStoryRetry';

/**
 * @deprecated Utilisez les hooks spécifiques useStoryCreation, useStoryDeletion, etc.
 * Ce hook est maintenu pour assurer la rétrocompatibilité.
 */
export const useSupabaseStoryMutations = () => {
  const { toast } = useToast();
  const { createStory } = useStoryCreation();
  const { deleteStory } = useStoryDeletion();
  const { updateStoryStatus } = useStoryUpdate();
  const { retryStoryGeneration } = useStoryRetry();

  console.warn(
    "Le hook useSupabaseStoryMutations est déprécié. " +
    "Veuillez utiliser les hooks spécifiques: useStoryCreation, useStoryDeletion, useStoryUpdate, useStoryRetry."
  );

  return {
    createStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration
  };
};

export default useSupabaseStoryMutations;
