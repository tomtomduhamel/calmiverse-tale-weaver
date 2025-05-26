
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { Story } from '@/types/story';

interface UseStoryFromUrlProps {
  stories: Story[];
  setCurrentStory: (story: Story | null) => void;
}

export const useStoryFromUrl = ({ stories, setCurrentStory }: UseStoryFromUrlProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoadingFromUrl, setIsLoadingFromUrl] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const viewParam = searchParams.get('view');
    const storyParam = searchParams.get('story');

    console.log("[useStoryFromUrl] Paramètres URL:", { viewParam, storyParam });

    if (viewParam === 'reader' && storyParam) {
      setIsLoadingFromUrl(true);
      
      // Chercher l'histoire dans la liste
      const foundStory = stories.find(story => story.id === storyParam);
      
      if (foundStory) {
        console.log("[useStoryFromUrl] Histoire trouvée:", foundStory.id);
        setCurrentStory(foundStory);
      } else {
        console.error("[useStoryFromUrl] Histoire non trouvée:", storyParam);
        // Rediriger vers la bibliothèque si l'histoire n'existe pas
        navigate('/library');
      }
      
      setIsLoadingFromUrl(false);
    }
  }, [location.search, stories, setCurrentStory, navigate]);

  return { isLoadingFromUrl };
};
