
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';

export const useStoryCloudFunctions = () => {
  const { toast } = useToast();
  const functions = getFunctions();
  
  const callCloudFunctionWithRetry = useCallback(async (functionName: string, data: any, attempt = 1) => {
    try {
      console.log(`Calling cloud function ${functionName} with data:`, data);
      
      // Use Firebase httpsCallable to call the cloud function
      const cloudFunction = httpsCallable(functions, functionName);
      const result = await cloudFunction(data);
      
      console.log(`Cloud function ${functionName} returned:`, result);
      return result.data;
    } catch (error) {
      console.error(`Error calling cloud function ${functionName}:`, error);
      if (attempt < 3) {
        console.log(`Retrying cloud function ${functionName}, attempt ${attempt + 1}`);
        return callCloudFunctionWithRetry(functionName, data, attempt + 1);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue';
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      throw error;
    }
  }, [toast, functions]);
  
  const retryStoryGeneration = useCallback(async (storyId: string) => {
    try {
      if (!storyId) {
        throw new Error("ID d'histoire manquant");
      }
      console.log(`Attempting to retry story generation for story ID: ${storyId}`);
      const result = await callCloudFunctionWithRetry('retryFailedStory', { storyId });
      
      // Success notification
      toast({
        title: 'Succès',
        description: 'Nouvelle tentative de génération lancée avec succès',
      });
      
      return result;
    } catch (error) {
      console.error('Error in retryStoryGeneration:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de la relance de génération';
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [callCloudFunctionWithRetry, toast]);

  return {
    callCloudFunctionWithRetry,
    retryStoryGeneration
  };
};
