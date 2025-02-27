
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";

export const useStoryCloudFunctions = () => {
  const { toast } = useToast();
  
  const MAX_RETRY_ATTEMPTS = 2;
  const RETRY_DELAY = 3000;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const callCloudFunctionWithRetry = async (functionName: string, data: any, attempt = 0): Promise<any> => {
    try {
      console.log(`Calling cloud function '${functionName}' (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1})`, data);
      const cloudFunction = httpsCallable(functions, functionName);
      const result = await cloudFunction(data);
      console.log(`Cloud function '${functionName}' executed successfully`, result);
      
      // Dispatch success notification
      const successEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'success',
          title: 'Génération réussie',
          message: 'Votre histoire a été générée avec succès'
        }
      });
      document.dispatchEvent(successEvent);
      
      return result.data;
    } catch (error: any) {
      console.error(`Error calling cloud function '${functionName}':`, error);
      
      // Extract detailed error message if available
      let errorMessage = "Une erreur est survenue lors de l'appel à la fonction cloud";
      
      if (error.message) {
        errorMessage = error.message;
        
        // Try to parse JSON error message
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        } catch (parseError) {
          // Not a JSON string, use the error message as is
        }
      } else if (error.details) {
        errorMessage = typeof error.details === 'string' 
          ? error.details 
          : JSON.stringify(error.details);
      }
      
      // Special handling for specific error types
      if (errorMessage.includes('Secret Manager') || errorMessage.includes('API key')) {
        errorMessage = "Problème de configuration du serveur. Veuillez contacter l'administrateur.";
      }
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying cloud function '${functionName}' in ${RETRY_DELAY}ms... (${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
        
        // Show retry notification
        toast({
          title: "Nouvelle tentative",
          description: `Tentative ${attempt + 1}/${MAX_RETRY_ATTEMPTS} de génération...`,
        });
        
        await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        return callCloudFunctionWithRetry(functionName, data, attempt + 1);
      }
      
      // If we've exhausted retries, throw a user-friendly error
      const finalErrorMessage = `Impossible de générer l'histoire après plusieurs tentatives. ${errorMessage}`;
      console.error("Final error after retries:", finalErrorMessage);
      
      // Dispatch final error notification
      const errorEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'error',
          title: 'Échec de la génération',
          message: finalErrorMessage
        }
      });
      document.dispatchEvent(errorEvent);
      
      throw new Error(finalErrorMessage);
    }
  };

  return {
    callCloudFunctionWithRetry
  };
};
