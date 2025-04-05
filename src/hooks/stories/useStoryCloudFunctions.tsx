
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Story } from '@/types/story';

// Define type for story response from cloud function
export interface StoryResponse {
  id_stories: string;
  story_text: string;
  story_summary: string;
  status: 'pending' | 'completed' | 'read';
  createdAt: Date;
  title: string;
  preview: string;
}

// Define the expected structure of the cloud function response
interface CloudFunctionResult {
  success?: boolean;
  storyData?: StoryResponse;
  error?: string;
  message?: string;
}

export const useStoryCloudFunctions = () => {
  const { toast } = useToast();
  const functions = getFunctions();
  
  const callCloudFunctionWithRetry = useCallback(async (functionName: string, data: any, attempt = 1) => {
    try {
      console.log(`Calling cloud function ${functionName} with data:`, data);
      
      // Prefixing 'v2-' for all functions-v2 functions
      const fullFunctionName = functionName.startsWith('v2-') 
        ? functionName 
        : `v2-${functionName}`;
      
      console.log(`Using full function name: ${fullFunctionName}`);
      
      // Use Firebase httpsCallable to call the cloud function
      const cloudFunction = httpsCallable(functions, fullFunctionName);
      const result = await cloudFunction(data);
      
      console.log(`Cloud function ${fullFunctionName} returned:`, result);
      
      // Check if the result has a "data" property that contains our actual response
      if (result && result.data) {
        const responseData = result.data as CloudFunctionResult;
        
        // If there's an error field in the response, throw it
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        
        // Extract storyData if it exists, otherwise return the whole response
        return responseData.storyData || responseData;
      }
      
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

  const generateStory = useCallback(async (objective: string, childrenNames: string[]): Promise<StoryResponse> => {
    try {
      console.log('Calling generateStory cloud function with:', { objective, childrenNames });
      const result = await callCloudFunctionWithRetry('generateStory', { 
        objective,
        childrenNames
      });
      
      console.log('Story generation result:', result);
      
      // Ensure we have a properly formatted StoryResponse object
      if (result && typeof result === 'object') {
        // Use type assertion with proper checking
        const resultObj = result as Record<string, unknown>;
        
        // If result contains storyData property, use that
        if (resultObj.storyData && typeof resultObj.storyData === 'object') {
          return resultObj.storyData as StoryResponse;
        }
        
        // If result itself appears to be a StoryResponse, verify required properties
        if (
          'story_text' in resultObj && 
          'id_stories' in resultObj &&
          'story_summary' in resultObj &&
          'status' in resultObj &&
          'title' in resultObj &&
          'preview' in resultObj
        ) {
          // Cast to unknown first, then to StoryResponse as TypeScript suggests
          return resultObj as unknown as StoryResponse;
        }
      }
      
      throw new Error("Format de réponse invalide du générateur d'histoire");
    } catch (error) {
      console.error('Error in generateStory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de la génération de l\'histoire';
      
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
    retryStoryGeneration,
    generateStory
  };
};
