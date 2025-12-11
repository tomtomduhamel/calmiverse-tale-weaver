
import { useCallback } from 'react';
import { useOptimizedStoriesQuery as useStoriesQuery } from './useOptimizedStoriesQuery';
import { useStoryCreation } from './useStoryCreation';
import { useStoryDeletion } from './useStoryDeletion';
import { useStoryUpdate } from './useStoryUpdate';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';
import { usePendingStoryMonitor } from './monitoring/usePendingStoryMonitor';
import { useRealtimeStoryMonitor } from './useRealtimeStoryMonitor';
import { useStoryFavorites } from './useStoryFavorites';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook principal pour gérer les histoires avec Supabase
 * Maintenant avec monitoring en temps réel et gestion des favoris intégrée
 */
export const useSupabaseStories = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  
  // Utilisation des hooks spécialisés
  const { stories, isLoading, error, fetchStories, forceRefresh, removeStoryFromList } = useStoriesQuery();
  const { createStory } = useStoryCreation();
  const { deleteStory } = useStoryDeletion();
  const { updateStoryStatus } = useStoryUpdate();
  const { retryStoryGeneration } = useStoryCloudFunctions();
  const { toggleFavorite, getFavoriteStories, isUpdating: isUpdatingFavorite } = useStoryFavorites();
  
  // Surveillance améliorée des histoires en attente (fallback)
  const pendingMonitor = usePendingStoryMonitor({
    stories,
    fetchStories: forceRefresh, // Use forceRefresh for pending monitor
    onStoryCompleted: (story) => {
      console.log(`[SupabaseStories] Histoire complétée: ${story.id}`);
      // Rafraîchir les données pour s'assurer d'avoir la dernière version
      forceRefresh();
    }
  });

  // Monitoring en temps réel principal
  const realtimeMonitor = useRealtimeStoryMonitor({
    onStoryCreated: (story) => {
      console.log(`[SupabaseStories] Histoire créée détectée en temps réel: ${story.id}`);
      // Use debounced fetch for real-time updates
      fetchStories();
    },
    enabled: true
  });
  
  // Gestion des favoris avec rafraîchissement automatique
  const handleToggleFavorite = useCallback(async (storyId: string, currentFavoriteStatus: boolean): Promise<boolean> => {
    const success = await toggleFavorite(storyId, currentFavoriteStatus);
    if (success) {
      // Use debounced refresh for favorites
      fetchStories();
    }
    return success;
  }, [toggleFavorite, fetchStories]);
  
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
      
      // Démarrer la surveillance en temps réel en priorité
      realtimeMonitor.startMonitoring();
      
      // Démarrer la surveillance de fallback
      pendingMonitor.setPendingStoryId(storyId);
      
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire. Surveillance en temps réel activée.",
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
  }, [user, createStory, toast, pendingMonitor, realtimeMonitor]);

  // Fonction pour forcer le rafraîchissement avec vérification de santé
  const handleForceRefresh = useCallback(async () => {
    console.log('[SupabaseStories] Force refresh des histoires');
    try {
      forceRefresh(); // Use the optimized force refresh
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
  }, [forceRefresh, toast]);

  return {
    stories,
    isLoading,
    error,
    fetchStories,
    forceRefresh: handleForceRefresh,
    createStory: handleCreateStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration,
    // Mise à jour optimiste pour suppression
    removeStoryFromList,
    // Nouvelles fonctionnalités de favoris
    toggleFavorite: handleToggleFavorite,
    getFavoriteStories,
    isUpdatingFavorite,
    // Exposer les fonctionnalités de surveillance (fallback)
    pendingStoryId: pendingMonitor.pendingStoryId,
    isMonitoring: pendingMonitor.isMonitoring || realtimeMonitor.isMonitoring,
    lastCheck: pendingMonitor.lastCheck,
    stopMonitoring: () => {
      pendingMonitor.stopMonitoring();
      realtimeMonitor.stopMonitoring();
    },
    // Nouvelles fonctionnalités de monitoring temps réel
    startRealtimeMonitoring: realtimeMonitor.startMonitoring,
    isRealtimeMonitoring: realtimeMonitor.isMonitoring,
    lastDetectedStory: realtimeMonitor.lastDetectedStory
  };
};

export default useSupabaseStories;
