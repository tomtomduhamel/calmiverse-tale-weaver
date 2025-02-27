
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useStoryCloudFunctions = () => {
  const { toast } = useToast();
  
  const callCloudFunctionWithRetry = useCallback(async (functionName: string, data: any, attempt = 1) => {
    try {
      console.log(`Calling cloud function ${functionName} with data:`, data);
      // Here would be the actual cloud function call implementation
      return { success: true };
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
  }, [toast]);
  
  const retryStoryGeneration = useCallback(async (storyId: string) => {
    return callCloudFunctionWithRetry('retryStoryGeneration', { storyId });
  }, [callCloudFunctionWithRetry]);

  return {
    callCloudFunctionWithRetry,
    retryStoryGeneration
  };
};
