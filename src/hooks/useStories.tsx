import { useState } from 'react';
import type { Story } from '@/types/story';
import { useStoriesQuery } from './stories/useStoriesQuery';
import { useStoryMutations } from './stories/useStoryMutations';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useToast } from './use-toast';

export const useStories = (children: any[] = []) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const stories = useStoriesQuery();
  const { createStory, deleteStory } = useStoryMutations();
  const { toast } = useToast();
  const functions = getFunctions();
  const generateStoryFunction = httpsCallable(functions, 'generateStory');

  const handleStoryCreation = async (formData: { childrenIds: string[], objective: string }) => {
    try {
      // Créer d'abord l'histoire dans Firestore
      const storyId = await createStory(formData, children);
      
      if (storyId) {
        console.log('Histoire créée dans Firestore avec ID:', storyId);
        
        // Appeler la fonction Cloud pour générer le contenu
        const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
        const childrenNames = selectedChildren.map(child => child.name);
        
        console.log('Appel de la fonction Cloud avec les données:', {
          prompt: formData.objective,
          objective: formData.objective,
          childrenNames: childrenNames
        });

        const result = await generateStoryFunction({
          data: {
            prompt: formData.objective,
            objective: formData.objective,
            childrenNames: childrenNames
          }
        });

        console.log('Résultat de la fonction Cloud:', result);
        return storyId;
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'histoire:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'histoire",
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