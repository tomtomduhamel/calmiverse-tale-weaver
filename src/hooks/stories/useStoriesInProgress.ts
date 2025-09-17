import { useState, useCallback, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface StoryInProgress {
  id: string;
  childrenIds: string[];
  objective: string;
  title?: string;
  startTime: number;
  progress?: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface StoriesInProgressState {
  [storyId: string]: StoryInProgress;
}

/**
 * Hook pour gérer l'état global des histoires en cours de génération
 * Complète le système de file d'attente avec un état React
 */
export const useStoriesInProgress = () => {
  const { user } = useSupabaseAuth();
  const [storiesInProgress, setStoriesInProgress] = useState<StoriesInProgressState>({});

  /**
   * Ajoute une histoire à l'état des histoires en cours
   */
  const addStoryToProgress = useCallback((storyId: string, storyData: Omit<StoryInProgress, 'id' | 'status'>) => {
    setStoriesInProgress(prev => ({
      ...prev,
      [storyId]: {
        id: storyId,
        ...storyData,
        status: 'pending'
      }
    }));
    
    console.log('[useStoriesInProgress] Histoire ajoutée:', storyId);
  }, []);

  /**
   * Met à jour le progrès d'une histoire
   */
  const updateStoryProgress = useCallback((storyId: string, updates: Partial<StoryInProgress>) => {
    setStoriesInProgress(prev => {
      if (!prev[storyId]) {
        console.warn('[useStoriesInProgress] Tentative de mise à jour d\'une histoire inexistante:', storyId);
        return prev;
      }

      return {
        ...prev,
        [storyId]: {
          ...prev[storyId],
          ...updates
        }
      };
    });

    console.log('[useStoriesInProgress] Progrès mis à jour pour:', storyId, updates);
  }, []);

  /**
   * Retire une histoire de l'état des histoires en cours
   */
  const removeStoryFromProgress = useCallback((storyId: string) => {
    setStoriesInProgress(prev => {
      const { [storyId]: removed, ...rest } = prev;
      if (removed) {
        console.log('[useStoriesInProgress] Histoire retirée:', storyId);
      }
      return rest;
    });
  }, []);

  /**
   * Obtient une histoire spécifique en cours
   */
  const getStoryInProgress = useCallback((storyId: string): StoryInProgress | null => {
    return storiesInProgress[storyId] || null;
  }, [storiesInProgress]);

  /**
   * Obtient toutes les histoires en cours
   */
  const getAllStoriesInProgress = useCallback((): StoryInProgress[] => {
    return Object.values(storiesInProgress);
  }, [storiesInProgress]);

  /**
   * Obtient le nombre d'histoires en cours
   */
  const getStoriesInProgressCount = useCallback((): number => {
    return Object.keys(storiesInProgress).length;
  }, [storiesInProgress]);

  /**
   * Obtient les histoires par statut
   */
  const getStoriesByStatus = useCallback((status: StoryInProgress['status']): StoryInProgress[] => {
    return Object.values(storiesInProgress).filter(story => story.status === status);
  }, [storiesInProgress]);

  /**
   * Marque une histoire comme terminée
   */
  const completeStory = useCallback((storyId: string, finalStoryId?: string) => {
    updateStoryProgress(storyId, { 
      status: 'completed', 
      progress: 100 
    });

    // Auto-suppression après 10 secondes pour libérer la mémoire
    setTimeout(() => {
      removeStoryFromProgress(storyId);
    }, 10000);
  }, [updateStoryProgress, removeStoryFromProgress]);

  /**
   * Marque une histoire comme ayant échoué
   */
  const failStory = useCallback((storyId: string, error: string) => {
    updateStoryProgress(storyId, { 
      status: 'error', 
      error 
    });

    // Auto-suppression après 30 secondes pour laisser le temps à l'utilisateur de voir l'erreur
    setTimeout(() => {
      removeStoryFromProgress(storyId);
    }, 30000);
  }, [updateStoryProgress, removeStoryFromProgress]);

  /**
   * Nettoie les histoires anciennes (plus de 1 heure)
   */
  const cleanupOldStories = useCallback(() => {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    setStoriesInProgress(prev => {
      const cleaned = Object.fromEntries(
        Object.entries(prev).filter(([_, story]) => story.startTime > oneHourAgo)
      );
      
      const removedCount = Object.keys(prev).length - Object.keys(cleaned).length;
      if (removedCount > 0) {
        console.log('[useStoriesInProgress] Nettoyage automatique:', removedCount, 'histoires supprimées');
      }
      
      return cleaned;
    });
  }, []);

  /**
   * Sauvegarde dans le localStorage
   */
  const saveToStorage = useCallback(() => {
    if (user) {
      try {
        localStorage.setItem(
          `calmiverse_stories_in_progress_${user.id}`,
          JSON.stringify({
            stories: storiesInProgress,
            timestamp: Date.now()
          })
        );
      } catch (error) {
        console.error('[useStoriesInProgress] Erreur sauvegarde localStorage:', error);
      }
    }
  }, [storiesInProgress, user]);

  /**
   * Charge depuis le localStorage
   */
  const loadFromStorage = useCallback(() => {
    if (user) {
      try {
        const stored = localStorage.getItem(`calmiverse_stories_in_progress_${user.id}`);
        if (stored) {
          const { stories, timestamp } = JSON.parse(stored);
          
          // Ne charger que si moins de 4 heures
          if (Date.now() - timestamp < 4 * 60 * 60 * 1000) {
            setStoriesInProgress(stories || {});
            console.log('[useStoriesInProgress] État rechargé depuis localStorage');
          }
        }
      } catch (error) {
        console.error('[useStoriesInProgress] Erreur chargement localStorage:', error);
      }
    }
  }, [user]);

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    saveToStorage();
  }, [saveToStorage]);

  // Chargement initial et nettoyage périodique
  useEffect(() => {
    loadFromStorage();

    const cleanupInterval = setInterval(cleanupOldStories, 10 * 60 * 1000); // Toutes les 10 minutes
    return () => clearInterval(cleanupInterval);
  }, [loadFromStorage, cleanupOldStories]);

  return {
    storiesInProgress,
    addStoryToProgress,
    updateStoryProgress,
    removeStoryFromProgress,
    getStoryInProgress,
    getAllStoriesInProgress,
    getStoriesInProgressCount,
    getStoriesByStatus,
    completeStory,
    failStory,
    cleanupOldStories
  };
};