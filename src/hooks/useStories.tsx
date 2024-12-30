import { useState } from 'react';
import type { Story } from '@/types/story';
import { useStoriesQuery } from './stories/useStoriesQuery';
import { useStoryMutations } from './stories/useStoryMutations';

export const useStories = (children: any[] = []) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const stories = useStoriesQuery();
  const { createStory, deleteStory } = useStoryMutations();

  return {
    stories,
    currentStory,
    setCurrentStory,
    createStory: (formData: { childrenIds: string[], objective: string }) => 
      createStory(formData, children),
    deleteStory,
  };
};