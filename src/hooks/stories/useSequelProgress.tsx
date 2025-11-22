import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export interface SequelProgress {
  status: 'initializing' | 'creating' | 'analyzing' | 'generating' | 'finalizing' | 'completed' | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // en secondes
}

interface UseSequelProgressResult extends SequelProgress {
  isPolling: boolean;
  stopPolling: () => void;
}

/**
 * Hook de progression temps réel basé sur le statut réel de la story dans Supabase
 * Utilise un polling intelligent toutes les 2s pour suivre la génération
 */
export const useSequelProgress = (storyId: string | null): UseSequelProgressResult => {
  const [progress, setProgress] = useState<SequelProgress>({
    status: 'initializing',
    progress: 0,
    message: 'Initialisation de la suite...'
  });
  const [isPolling, setIsPolling] = useState(false);

  const calculateRealProgress = useCallback((story: Partial<Story>): SequelProgress => {
    // Story terminée
    if (story.status === 'completed' || story.status === 'ready') {
      return {
        status: 'completed',
        progress: 100,
        message: 'Suite créée avec succès !'
      };
    }

    // Erreur
    if (story.status === 'error') {
      return {
        status: 'error',
        progress: 0,
        message: story.error || 'Une erreur est survenue'
      };
    }

    // En cours de génération - analyser le contenu pour progression réelle
    if (story.status === 'pending') {
      // Phase 4: Génération du contenu (50% → 90%)
      if (story.content && story.content.length > 0) {
        // Estimation: histoire complète ≈ 8000 caractères
        const contentProgress = Math.min((story.content.length / 8000) * 100, 100);
        const mappedProgress = 50 + (contentProgress * 0.4); // Map 0-100% to 50-90%
        
        // Estimation du temps restant basée sur la progression
        const estimatedTimeRemaining = contentProgress < 50 
          ? 180 // 3 minutes si début
          : 60; // 1 minute si presque fini

        return {
          status: 'generating',
          progress: Math.min(mappedProgress, 90),
          message: 'Génération de l\'histoire en cours...',
          estimatedTimeRemaining
        };
      }

      // Phase 3: Analyse de l'histoire précédente (30% → 50%)
      if (story.story_analysis) {
        return {
          status: 'analyzing',
          progress: 40,
          message: 'Analyse de l\'histoire précédente...',
          estimatedTimeRemaining: 240 // 4 minutes
        };
      }

      // Phase 2: Création de l'entrée en base (15% → 30%)
      if (story.id) {
        return {
          status: 'creating',
          progress: 20,
          message: 'Configuration de la suite...',
          estimatedTimeRemaining: 300 // 5 minutes
        };
      }
    }

    // Phase 1: Initialisation (0% → 15%)
    return {
      status: 'initializing',
      progress: 10,
      message: 'Préparation de la génération...',
      estimatedTimeRemaining: 360 // 6 minutes
    };
  }, []);

  const pollProgress = useCallback(async () => {
    if (!storyId) return;

    try {
      const { data: story, error } = await supabase
        .from('stories')
        .select('id, status, content, story_analysis, error, title')
        .eq('id', storyId)
        .single();

      if (error) {
        console.error('[useSequelProgress] Erreur polling:', error);
        setProgress({
          status: 'error',
          progress: 0,
          message: 'Erreur de connexion'
        });
        return;
      }

      if (story) {
        const realProgress = calculateRealProgress(story);
        setProgress(realProgress);

        // Arrêter le polling si terminé ou erreur
        if (realProgress.status === 'completed' || realProgress.status === 'error') {
          setIsPolling(false);
        }
      }
    } catch (err) {
      console.error('[useSequelProgress] Exception:', err);
      setProgress({
        status: 'error',
        progress: 0,
        message: 'Erreur inattendue'
      });
    }
  }, [storyId, calculateRealProgress]);

  // Démarrer le polling quand storyId est fourni
  useEffect(() => {
    if (!storyId) {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);

    // Premier appel immédiat
    pollProgress();

    // Polling toutes les 2 secondes
    const interval = setInterval(pollProgress, 2000);

    return () => {
      clearInterval(interval);
      setIsPolling(false);
    };
  }, [storyId, pollProgress]);

  const stopPolling = useCallback(() => {
    setIsPolling(false);
  }, []);

  return {
    ...progress,
    isPolling,
    stopPolling
  };
};
