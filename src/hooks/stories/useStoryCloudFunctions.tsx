
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getFunctions, httpsCallable } from 'firebase/functions';
import type { Story } from '@/types/story';

// Définir le type pour la réponse de la fonction cloud d'histoire
export interface StoryResponse {
  id_stories: string;
  story_text: string;
  story_summary: string;
  status: 'pending' | 'completed' | 'read';
  createdAt: Date;
  title: string;
  preview: string;
}

// Définir la structure attendue de la réponse de la fonction cloud
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
      console.log(`Appel de la fonction cloud ${functionName} avec les données:`, data);
      
      // Utilisation du nom exact de la fonction sans préfixe
      const cloudFunction = httpsCallable(functions, functionName);
      const result = await cloudFunction(data);
      
      console.log(`La fonction cloud ${functionName} a retourné:`, result);
      
      // Vérifier si le résultat contient une propriété "data" qui contient notre réponse réelle
      if (result && result.data) {
        const responseData = result.data as CloudFunctionResult;
        
        // S'il y a un champ d'erreur dans la réponse, le lancer
        if (responseData.error) {
          throw new Error(responseData.error);
        }
        
        // Extraire storyData s'il existe, sinon retourner la réponse entière
        return responseData.storyData || responseData;
      }
      
      return result.data;
    } catch (error) {
      console.error(`Erreur lors de l'appel de la fonction cloud ${functionName}:`, error);
      if (attempt < 3) {
        console.log(`Nouvelle tentative pour la fonction cloud ${functionName}, tentative ${attempt + 1}`);
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
      console.log(`Tentative de régénération d'histoire pour l'ID: ${storyId}`);
      const result = await callCloudFunctionWithRetry('retryFailedStory', { storyId });
      
      // Notification de réussite
      toast({
        title: 'Succès',
        description: 'Nouvelle tentative de génération lancée avec succès',
      });
      
      return result;
    } catch (error) {
      console.error('Erreur dans retryStoryGeneration:', error);
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
      console.log('Appel de la fonction cloud generateStory avec:', { objective, childrenNames });
      const result = await callCloudFunctionWithRetry('generateStory', { 
        objective,
        childrenNames
      });
      
      console.log('Résultat de la génération d\'histoire:', result);
      
      // Valider les données de réponse
      if (!result || typeof result !== 'object') {
        throw new Error("Format de réponse invalide du générateur d'histoire");
      }
      
      // Convertir en un enregistrement générique pour un accès plus sûr
      const resultData = result as Record<string, unknown>;
      
      // Si le résultat contient une propriété storyData qui est un objet, l'utiliser
      if (resultData.storyData && typeof resultData.storyData === 'object') {
        const storyData = resultData.storyData as Record<string, unknown>;
        
        // Vérifier que toutes les propriétés requises sont présentes
        if (validateStoryResponseFields(storyData)) {
          return storyData as unknown as StoryResponse;
        }
      }
      
      // Vérifier si le résultat lui-même est une StoryResponse valide
      if (validateStoryResponseFields(resultData)) {
        return resultData as unknown as StoryResponse;
      }
      
      // Si nous arrivons ici, le format de réponse est invalide
      console.error("Format de réponse invalide:", result);
      throw new Error("Format de réponse invalide du générateur d'histoire");
    } catch (error) {
      console.error('Erreur dans generateStory:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de la génération de l\'histoire';
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
      
      throw error;
    }
  }, [callCloudFunctionWithRetry, toast]);
  
  // Fonction utilitaire pour valider qu'une réponse a tous les champs StoryResponse requis
  const validateStoryResponseFields = (data: Record<string, unknown>): boolean => {
    const requiredFields = ['success', 'storyId', 'storyData'];
    
    return requiredFields.every(field => {
      const hasField = field in data;
      if (!hasField) {
        console.error(`Champ requis manquant dans la réponse: ${field}`);
      }
      return hasField;
    });
  };

  return {
    callCloudFunctionWithRetry,
    retryStoryGeneration,
    generateStory
  };
};
