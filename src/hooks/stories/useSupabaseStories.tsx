
import { useCallback } from 'react';
import { useStoriesQuery } from './useStoriesQuery';
import { useStoryCreation } from './useStoryCreation';
import { useStoryDeletion } from './useStoryDeletion';
import { useStoryUpdate } from './useStoryUpdate';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook principal pour gérer les histoires avec Supabase
 * Combine plusieurs hooks spécialisés pour fournir toutes les fonctionnalités
 * nécessaires à la gestion des histoires.
 */
export const useSupabaseStories = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  
  // Utilisation des hooks spécialisés
  const { stories, isLoading, error, fetchStories } = useStoriesQuery();
  const { createStory } = useStoryCreation();
  const { deleteStory } = useStoryDeletion();
  const { updateStoryStatus } = useStoryUpdate();
  const { retryStoryGeneration } = useStoryCloudFunctions();
  
  // Création d'une histoire avec gestion d'erreur centralisée
  const handleCreateStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une histoire",
        variant: "destructive",
      });
      throw new Error("Utilisateur non connecté");
    }
    
    try {
      console.log('🚀 Starting story creation process...', { formData, currentUser: user.id });
      const storyId = await createStory(formData, children);
      
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire, merci de patienter...",
      });
      
      return storyId;
    } catch (error: any) {
      console.error('❌ Error during story creation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, createStory, toast]);

  return {
    stories,
    isLoading,
    error,
    fetchStories,
    createStory: handleCreateStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration
  };
};

export default useSupabaseStories;
