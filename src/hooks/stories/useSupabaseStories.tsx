
import { useCallback } from 'react';
import { useStoriesQuery } from './useStoriesQuery';
import { useStoryCreation } from './useStoryCreation';
import { useStoryDeletion } from './useStoryDeletion';
import { useStoryUpdate } from './useStoryUpdate';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';
import { usePendingStoryMonitor } from './monitoring/usePendingStoryMonitor';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook principal pour gérer les histoires avec Supabase
 * Maintenant avec surveillance améliorée des timeouts et récupération automatique
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
  
  // Surveillance améliorée des histoires en attente
  const pendingMonitor = usePendingStoryMonitor({
    stories,
    fetchStories,
    onStoryCompleted: (story) => {
      console.log(`[SupabaseStories] Histoire complétée: ${story.id}`);
      // Rafraîchir les données pour s'assurer d'avoir la dernière version
      fetchStories();
    }
  });
  
  // Création d'une histoire avec gestion d'erreur centralisée et surveillance automatique
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
      console.log('🚀 Starting enhanced story creation process...', { formData, currentUser: user.id });
      const result = await createStory(formData, children);
      
      // Extraire l'ID de l'histoire du résultat
      const storyId = result.storyId;
      
      // Démarrer la surveillance automatique
      pendingMonitor.setPendingStoryId(storyId);
      
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire. Vous serez notifié dès qu'elle sera prête.",
      });
      
      return storyId;
    } catch (error: any) {
      console.error('❌ Error during enhanced story creation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, createStory, toast, pendingMonitor]);

  // Fonction pour forcer le rafraîchissement avec vérification de santé
  const forceRefresh = useCallback(async () => {
    console.log('[SupabaseStories] Force refresh des histoires');
    try {
      await fetchStories();
      toast({
        title: "Actualisation",
        description: "La liste des histoires a été mise à jour",
      });
    } catch (error: any) {
      console.error('[SupabaseStories] Erreur lors du rafraîchissement:', error);
      toast({
        title: "Erreur",
        description: "Impossible de rafraîchir la liste des histoires",
        variant: "destructive",
      });
    }
  }, [fetchStories, toast]);

  return {
    stories,
    isLoading,
    error,
    fetchStories,
    forceRefresh,
    createStory: handleCreateStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration,
    // Exposer les fonctionnalités de surveillance
    pendingStoryId: pendingMonitor.pendingStoryId,
    isMonitoring: pendingMonitor.isMonitoring,
    lastCheck: pendingMonitor.lastCheck,
    stopMonitoring: pendingMonitor.stopMonitoring
  };
};

export default useSupabaseStories;
