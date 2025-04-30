
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Définir le type pour la réponse de la fonction edge d'histoire
export interface StoryResponse {
  id_stories?: string;
  story_text: string;
  story_summary: string;
  status: 'pending' | 'completed' | 'read';
  createdAt?: Date;
  title: string;
  preview: string;
}

// Définir la structure attendue de la réponse de la fonction edge
interface CloudFunctionResult {
  success?: boolean;
  storyData?: StoryResponse;
  error?: string;
  message?: string;
  storyId?: string;
}

export const useStoryCloudFunctions = () => {
  const { toast } = useToast();
  
  const callCloudFunctionWithRetry = useCallback(async (functionName: string, data: any, attempt = 1) => {
    try {
      console.log(`Appel de la fonction Edge Supabase ${functionName} avec les données:`, data);
      
      const { data: result, error } = await supabase.functions.invoke(functionName, {
        body: data
      });
      
      if (error) throw error;
      
      console.log(`La fonction ${functionName} a retourné:`, result);
      
      return result;
    } catch (error) {
      console.error(`Erreur lors de l'appel de la fonction ${functionName}:`, error);
      if (attempt < 3) {
        console.log(`Nouvelle tentative pour la fonction ${functionName}, tentative ${attempt + 1}`);
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
    try {
      if (!storyId) {
        throw new Error("ID d'histoire manquant");
      }
      console.log(`Tentative de régénération d'histoire pour l'ID: ${storyId}`);
      const result = await callCloudFunctionWithRetry('retry-story', { storyId });
      
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

  const generateStory = useCallback(async (objective: string, childrenNames: string[]): Promise<any> => {
    try {
      console.log('Appel de la fonction Edge Supabase generate-story avec:', { objective, childrenNames });
      
      // Générer un ID aléatoire pour l'histoire
      const storyId = Date.now().toString();
      
      const result = await callCloudFunctionWithRetry('generate-story', { 
        storyId,
        objective,
        childrenNames
      });
      
      console.log('Résultat de la génération d\'histoire:', result);
      
      // Valider les données de réponse
      if (!result || typeof result !== 'object') {
        throw new Error("Format de réponse invalide du générateur d'histoire");
      }
      
      // Convertir en un enregistrement générique pour un accès plus sûr
      const resultData = result as CloudFunctionResult;
      
      // Si le résultat contient une propriété storyData qui est un objet, l'utiliser
      if (resultData.storyData && typeof resultData.storyData === 'object') {
        return {
          success: true,
          storyData: resultData.storyData,
          storyId: resultData.storyId || storyId
        };
      }
      
      // Construire une réponse minimale si storyData n'existe pas
      return {
        success: resultData.success || false,
        storyId: resultData.storyId || storyId,
        storyData: {
          title: "Histoire générée",
          story_text: "Le contenu de l'histoire n'a pas pu être récupéré correctement.",
          story_summary: "Résumé non disponible",
          preview: "Prévisualisation non disponible",
          status: "completed"
        }
      };
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

  return {
    callCloudFunctionWithRetry,
    retryStoryGeneration,
    generateStory
  };
};
