
import { useState, useEffect } from 'react';
import type { Story } from '@/types/story';
import { useStoriesQuery } from './stories/useStoriesQuery';
import { useStoryMutations } from './stories/useStoryMutations';
import { useToast } from './use-toast';

export const useStories = (children: any[] = []) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const stories = useStoriesQuery();
  const { createStory, deleteStory, updateStoryStatus, retryStoryGeneration } = useStoryMutations();
  const { toast } = useToast();

  // Listen for application-level errors
  useEffect(() => {
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setLastError(event.detail.message);
      } else if (event.detail.type === 'success') {
        setLastError(null);
      } else if (event.detail.type === 'retry') {
        setIsRetrying(true);
      }
    };
    
    document.addEventListener('app-notification', handleAppNotification as EventListener);
    
    return () => {
      document.removeEventListener('app-notification', handleAppNotification as EventListener);
    };
  }, []);

  // Update current story when stories change
  useEffect(() => {
    if (currentStory && stories.stories) {
      const updatedStory = stories.stories.find(story => story.id === currentStory.id);
      if (updatedStory && JSON.stringify(updatedStory) !== JSON.stringify(currentStory)) {
        setCurrentStory(updatedStory);
      }
    }
  }, [stories.stories, currentStory]);

  const handleStoryCreation = async (formData: { childrenIds: string[], objective: string }) => {
    try {
      console.log('Starting story creation process', formData);
      setLastError(null);
      setIsRetrying(false);
      
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
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la génération de l'histoire";
      setLastError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      // Dispatch an application-level event for the error
      const errorEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'error',
          title: 'Erreur de génération',
          message: errorMessage
        }
      });
      document.dispatchEvent(errorEvent);
      
      throw error;
    }
  };

  const retryFailedStory = async (storyId: string) => {
    try {
      console.log('Retrying failed story with ID:', storyId);
      setIsRetrying(true);
      
      // Find the story in the collection
      const failedStory = stories.stories?.find(story => story.id === storyId);
      
      if (!failedStory) {
        throw new Error("Histoire introuvable");
      }
      
      // Create a retry event
      const retryEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'retry',
          storyId: storyId
        }
      });
      document.dispatchEvent(retryEvent);
      
      toast({
        title: "Nouvelle tentative",
        description: "Nous réessayons de générer votre histoire",
      });
      
      // Call the retry function
      await retryStoryGeneration(storyId);
      
      setIsRetrying(false);
      return true;
    } catch (error) {
      console.error('Error retrying story:', error);
      setIsRetrying(false);
      
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la nouvelle tentative";
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  };

  return {
    stories,
    currentStory,
    setCurrentStory,
    createStory: handleStoryCreation,
    deleteStory,
    retryFailedStory,
    lastError,
    isRetrying,
    clearError: () => setLastError(null)
  };
};
