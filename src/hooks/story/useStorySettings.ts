
import { useState, useCallback } from 'react';
import type { Story, StorySettings } from '@/types/story';

export const useStorySettings = (story: Story | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateStorySettings = useCallback(async (settings: StorySettings) => {
    if (!story) return;

    setIsLoading(true);
    setError(null);

    try {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Story settings updated:', settings);
      
    } catch (err) {
      setError('Failed to update story settings');
      console.error('Error updating story settings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [story]);

  const calculateWordCount = useCallback(() => {
    if (!story?.content) return 0; // CORRECTION: utiliser 'content' au lieu de 'story_text'
    return story.content.trim().split(/\s+/).length;
  }, [story?.content]);

  return {
    updateStorySettings,
    calculateWordCount,
    isLoading,
    error
  };
};
