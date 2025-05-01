
import { useStoryGeneration } from './useStoryGeneration';
import { useStoryRetry } from './useStoryRetry';
import { useCloudFunctionUtils } from './useCloudFunctionUtils';

export const useStoryCloudFunctions = () => {
  const { generateStory } = useStoryGeneration();
  const { retryStoryGeneration } = useStoryRetry();
  const { callCloudFunctionWithRetry } = useCloudFunctionUtils();

  return {
    generateStory,
    retryStoryGeneration,
    callCloudFunctionWithRetry
  };
};
