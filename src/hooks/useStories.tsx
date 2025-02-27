
import { useState } from 'react';
import type { Story } from '@/types/story';
import { useStoriesQuery } from './stories/useStoriesQuery';
import { useStoryMutations } from './stories/useStoryMutations';
import { useToast } from './use-toast';

export const useStories = (children: any[] = []) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const stories = useStoriesQuery();
  const { createStory, deleteStory } = useStoryMutations();
  const { toast } = useToast();

  const handleStoryCreation = async (formData: { childrenIds: string[], objective: string }) => {
    try {
      console.log('Starting story creation process', formData);
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      console.log('Selected children:', {
        count: childrenNames.length,
        names: childrenNames
      });
      
      const storyId = await createStory(formData, children);
      
      if (storyId) {
        console.log('Story created successfully with ID:', storyId);
        toast({
          title: "Histoire en cours de création",
          description: "Votre histoire est en cours de génération et sera bientôt disponible",
        });
        return storyId;
      } else {
        throw new Error("La création de l'histoire a échoué");
      }
    } catch (error) {
      console.error('Error during story creation:', error);
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
