
import { useState, useEffect } from 'react';
import type { Story } from '@/types/story';
import { useStoriesQuery } from './stories/useStoriesQuery';
import { useStoryMutations } from './stories/useStoryMutations';
import { useToast } from './use-toast';

export const useStories = (children: any[] = []) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const stories = useStoriesQuery();
  const { createStory, deleteStory } = useStoryMutations();
  const { toast } = useToast();

  // Listen for application-level errors
  useEffect(() => {
    const handleAppError = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setLastError(event.detail.message);
      }
    };
    
    document.addEventListener('app-notification', handleAppError as EventListener);
    
    return () => {
      document.removeEventListener('app-notification', handleAppError as EventListener);
    };
  }, []);

  const handleStoryCreation = async (formData: { childrenIds: string[], objective: string }) => {
    try {
      console.log('Starting story creation process', formData);
      setLastError(null);
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      console.log('Selected children:', {
        count: childrenNames.length,
        names: childrenNames
      });
      
      // Use a safe, serializable data structure
      const safeFormData = {
        childrenIds: formData.childrenIds,
        objective: formData.objective,
        timestamp: new Date().toISOString()
      };
      
      const storyId = await createStory(safeFormData, children);
      
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
      
      // Set the error so it can be displayed in the UI
      setLastError(error instanceof Error ? error.message : "Une erreur est survenue lors de la génération de l'histoire");
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération de l'histoire",
        variant: "destructive",
      });
      
      // Dispatch an application-level event for the error
      const errorEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'error',
          title: 'Erreur de génération',
          message: error instanceof Error ? error.message : "Une erreur est survenue lors de la génération de l'histoire"
        }
      });
      document.dispatchEvent(errorEvent);
      
      throw error;
    }
  };

  return {
    stories,
    currentStory,
    setCurrentStory,
    createStory: handleStoryCreation,
    deleteStory,
    lastError,
    clearError: () => setLastError(null)
  };
};
