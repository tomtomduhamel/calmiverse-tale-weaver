
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { Story } from '@/types/story';

export const useStoryOperations = (
  createStory: any, 
  setLastError: (error: string | null) => void,
  setIsRetrying: (isRetrying: boolean) => void,
  setCurrentStory: (story: Story | null) => void,
  fetchStories: () => Promise<void>
) => {
  const { toast } = useToast();

  const handleStoryCreation = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
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
      
      const result = await createStory(safeFormData, children);
      
      if (result && result.storyId) {
        console.log('Story created successfully with ID:', result.storyId);
        
        // Récupérer l'histoire complétée depuis le résultat
        if (result.storyData) {
          // Formater l'histoire pour l'état local en utilisant les données renvoyées
          const formattedStory: Story = {
            id: result.storyData.id,
            title: result.storyData.title,
            preview: result.storyData.preview || result.storyData.content.substring(0, 200) + "...",
            objective: result.storyData.objective,
            childrenIds: result.storyData.childrenids || [],
            childrenNames: result.storyData.childrennames || childrenNames,
            createdAt: new Date(result.storyData.createdat),
            status: result.storyData.status,
            content: result.storyData.content, // CORRECTION: utiliser 'content' au lieu de 'story_text'
            story_summary: result.storyData.summary,
            error: result.storyData.error || null,
            updatedAt: new Date(result.storyData.updatedat)
          };
          
          // Mettre à jour l'état local avec la nouvelle histoire
          setCurrentStory(formattedStory);
          
          // Forcer le rafraîchissement de la liste des histoires
          fetchStories();
        }
        
        toast({
          title: "Histoire créée",
          description: "Votre histoire a été générée avec succès",
        });
        
        return result.storyId;
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
  }, [createStory, setLastError, setIsRetrying, setCurrentStory, fetchStories, toast]);

  const retryFailedStory = useCallback(async (storyId: string, retryStoryGeneration: any, stories: any) => {
    try {
      console.log('Retrying failed story with ID:', storyId);
      setIsRetrying(true);
      setLastError(null);
      
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
      const result = await retryStoryGeneration(storyId);
      console.log('Retry result:', result);
      
      // Forcer le rafraîchissement de la liste des histoires
      await fetchStories();
      
      // Si l'histoire a été relancée avec succès, mettre à jour l'histoire courante
      if (result && result.title) {
        // Trouver l'histoire mise à jour dans la liste des histoires
        const updatedStory = stories.stories?.find(story => story.id === storyId);
        if (updatedStory) {
          setCurrentStory(updatedStory);
        }
      }
      
      setIsRetrying(false);
      return true;
    } catch (error) {
      console.error('Error retrying story:', error);
      setIsRetrying(false);
      
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la nouvelle tentative";
      setLastError(errorMessage);
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      return false;
    }
  }, [setIsRetrying, setLastError, setCurrentStory, toast]);

  return {
    handleStoryCreation,
    retryFailedStory
  };
};
