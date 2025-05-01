
import { useCallback } from 'react';
import { useStoriesQuery } from './useStoriesQuery';
import { useStoryCreation } from './useStoryCreation';
import { useStoryDeletion } from './useStoryDeletion';
import { useStoryUpdate } from './useStoryUpdate';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';

export const useSupabaseStories = () => {
  const { stories, isLoading, error, fetchStories } = useStoriesQuery();
  const { createStory } = useStoryCreation();
  const { deleteStory } = useStoryDeletion();
  const { updateStoryStatus } = useStoryUpdate();
  const { retryStoryGeneration } = useStoryCloudFunctions();

  return {
    stories,
    isLoading,
    error,
    fetchStories,
    createStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration
  };
};

export default useSupabaseStories;
