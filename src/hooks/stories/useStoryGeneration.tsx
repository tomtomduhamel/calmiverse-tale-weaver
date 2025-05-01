
import { useCallback } from 'react';
import { useCloudFunctionUtils } from './useCloudFunctionUtils';

export const useStoryGeneration = () => {
  const { callCloudFunctionWithRetry } = useCloudFunctionUtils();

  const generateStory = useCallback(async (
    storyId: string, 
    objective: string, 
    childrenNames: string[]
  ) => {
    return await callCloudFunctionWithRetry(
      'generateStory',
      { storyId, objective, childrenNames }
    );
  }, [callCloudFunctionWithRetry]);

  return {
    generateStory
  };
};
