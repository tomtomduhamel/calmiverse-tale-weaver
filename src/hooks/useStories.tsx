
import { useStoriesQuery } from './stories/useStoriesQuery';
import { useStoryMutations } from './stories/useStoryMutations';
import { useStoriesState } from './stories/useStoriesState';
import { useStoryOperations } from './stories/useStoryOperations';
import { useStoryEvents } from './stories/useStoryEvents';

export const useStories = (children: any[] = []) => {
  const stories = useStoriesQuery();
  const { createStory, deleteStory, updateStoryStatus, retryStoryGeneration } = useStoryMutations();
  
  const {
    currentStory,
    setCurrentStory,
    lastError,
    setLastError,
    isRetrying,
    setIsRetrying,
    clearError
  } = useStoriesState(stories);

  // Set up event listeners
  useStoryEvents(setLastError, setIsRetrying);

  // Set up story operations
  const { handleStoryCreation, retryFailedStory } = useStoryOperations(
    createStory,
    setLastError,
    setIsRetrying,
    setCurrentStory,
    stories.fetchStories
  );

  const handleRetryFailedStory = async (storyId: string) => {
    return await retryFailedStory(storyId, retryStoryGeneration, stories);
  };

  return {
    stories,
    currentStory,
    setCurrentStory,
    createStory: handleStoryCreation,
    deleteStory,
    retryFailedStory: handleRetryFailedStory,
    lastError,
    isRetrying,
    clearError
  };
};
