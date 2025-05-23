
import { useCallback } from 'react';
import { useCloudFunctionUtils } from './useCloudFunctionUtils';
import { StorySettings } from '@/types/story';

export const useStoryGeneration = () => {
  const { callCloudFunctionWithRetry } = useCloudFunctionUtils();

  const generateStory = useCallback(async (
    storyId: string,
    objective?: string, 
    childrenNames?: string[]
  ) => {
    console.log("Génération d'histoire: ", { storyId, objective, childrenNames });
    return await callCloudFunctionWithRetry(
      'generateStory',
      { storyId, objective, childrenNames }
    );
  }, [callCloudFunctionWithRetry]);

  const regenerateStory = useCallback(async (
    storyId: string,
    settings: StorySettings
  ) => {
    console.log("Régénération d'histoire avec paramètres: ", { storyId, settings });
    return await callCloudFunctionWithRetry(
      'regenerateStory',
      { storyId, settings }
    );
  }, [callCloudFunctionWithRetry]);

  return {
    generateStory,
    regenerateStory
  };
};
