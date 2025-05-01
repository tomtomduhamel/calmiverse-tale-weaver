
import { useState, useEffect } from 'react';
import type { Story } from '@/types/story';

export const useStoriesState = (stories: any) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Update current story when stories change
  useEffect(() => {
    if (currentStory && stories.stories) {
      const updatedStory = stories.stories.find(story => story.id === currentStory.id);
      if (updatedStory && JSON.stringify(updatedStory) !== JSON.stringify(currentStory)) {
        setCurrentStory(updatedStory);
      }
    }
  }, [stories.stories, currentStory]);

  return {
    currentStory,
    setCurrentStory,
    lastError,
    setLastError,
    isRetrying,
    setIsRetrying,
    clearError: () => setLastError(null)
  };
};
