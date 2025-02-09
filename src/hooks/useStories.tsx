
import { useState } from 'react';
import type { Story } from '@/types/story';
import { useStoriesQuery } from './stories/useStoriesQuery';
import { useStoryMutations } from './stories/useStoryMutations';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from './use-toast';
import { functions } from '@/lib/firebase';

export const useStories = (children: any[] = []) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const stories = useStoriesQuery();
  const { createStory, deleteStory } = useStoryMutations();
  const { toast } = useToast();

  const handleStoryCreation = async (formData: { childrenIds: string[], objective: string }) => {
    try {
      const storyId = await createStory(formData, children);
      
      if (storyId) {
        console.log('Histoire créée dans Firestore avec ID:', storyId);
        
        const generateStoryFunction = httpsCallable(functions, 'generateStory');
        const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
        const childrenNames = selectedChildren.map(child => child.name);
        
        console.log('Appel de la fonction Cloud avec les données:', {
          storyId,
          objective: formData.objective,
          childrenNames
        });

        const result = await generateStoryFunction({
          storyId,
          objective: formData.objective,
          childrenNames
        });

        console.log('Résultat de la fonction Cloud:', result);
        return storyId;
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'histoire:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération de l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    stories,
    currentStory,
    setCurrentStory,
    createStory: handleStoryCreation,
    deleteStory,
  };
};

