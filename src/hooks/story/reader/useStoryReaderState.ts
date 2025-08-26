
import { useState, useEffect } from 'react';
import type { Story } from '@/types/story';

interface UseStoryReaderStateProps {
  initialStory: Story | null;
}

export const useStoryReaderState = ({ initialStory }: UseStoryReaderStateProps) => {
  const [story, setStory] = useState<Story | null>(initialStory);
  const [fontSize, setFontSize] = useState(16);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);

  // Mettre à jour l'état local quand initialStory change
  useEffect(() => {
    if (initialStory) {
      setStory(initialStory);
    }
  }, [initialStory]);

  return {
    story,
    setStory,
    fontSize,
    setFontSize,
    isDarkMode,
    setIsDarkMode,
    showSummary,
    setShowSummary,
    isUpdatingFavorite,
    setIsUpdatingFavorite
  };
};
