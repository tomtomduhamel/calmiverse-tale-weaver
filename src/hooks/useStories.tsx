
import { useSupabaseStories } from './stories/useSupabaseStories';
import { useStoryMutations } from './stories/useStoryMutations';
import { useStoriesState } from './stories/useStoriesState';
import { useStoryOperations } from './stories/useStoryOperations';
import { useStoryEvents } from './stories/useStoryEvents';

export const useStories = (children: any[] = []) => {
  const supabaseStories = useSupabaseStories();
  const { createStory, deleteStory, updateStoryStatus, retryStoryGeneration } = useStoryMutations();
  
  const {
    currentStory,
    setCurrentStory,
    lastError,
    setLastError,
    isRetrying,
    setIsRetrying,
    clearError
  } = useStoriesState(supabaseStories);

  // Set up event listeners
  useStoryEvents(setLastError, setIsRetrying);

  // Set up story operations
  const { handleStoryCreation, retryFailedStory } = useStoryOperations(
    createStory,
    setLastError,
    setIsRetrying,
    setCurrentStory,
    supabaseStories.fetchStories
  );

  const handleRetryFailedStory = async (storyId: string) => {
    return await retryFailedStory(storyId, retryStoryGeneration, supabaseStories);
  };

  return {
    stories: supabaseStories,
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
