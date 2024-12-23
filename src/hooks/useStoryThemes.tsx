import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getStoryThemes, createStoryTheme } from '@/lib/story-themes';
import type { StoryTheme } from '@/types/story-theme';

export const useStoryThemes = () => {
  const [themes, setThemes] = useState<StoryTheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchThemes = async () => {
    try {
      setIsLoading(true);
      const fetchedThemes = await getStoryThemes();
      setThemes(fetchedThemes);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les thèmes d'histoires",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTheme = async (theme: Omit<StoryTheme, 'id'>) => {
    try {
      const newThemeId = await createStoryTheme(theme);
      setThemes(prev => [...prev, { ...theme, id: newThemeId }]);
      toast({
        title: "Succès",
        description: "Le thème a été créé avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le thème",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  return {
    themes,
    isLoading,
    addTheme,
    refreshThemes: fetchThemes,
  };
};