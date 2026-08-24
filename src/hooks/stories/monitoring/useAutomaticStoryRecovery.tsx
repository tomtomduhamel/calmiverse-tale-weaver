import { useEffect, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useStoryRecovery } from './useStoryRecovery';
import type { Story } from '@/types/story';

interface AutoRecoveryOptions {
  enabled?: boolean;
  checkIntervalMs?: number;
  zombieThresholdMs?: number;
  maxAutoRetries?: number;
}

const DEFAULT_OPTIONS: Required<AutoRecoveryOptions> = {
  enabled: true,
  checkIntervalMs: 60000, // Vérifier toutes les minutes
  zombieThresholdMs: 180000, // 3 minutes = zombie
  maxAutoRetries: 2 // Maximum 2 tentatives automatiques
};

/**
 * Hook de récupération automatique des histoires bloquées
 * Surveille et tente de récupérer automatiquement les histoires "zombies"
 */
export const useAutomaticStoryRecovery = (
  stories: Story[],
  options: AutoRecoveryOptions = {}
) => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { toast } = useToast();
  const { recoverStuckStory } = useStoryRecovery();
  
  const recoveryAttemptsRef = useRef<Map<string, number>>(new Map());
  const lastCheckRef = useRef<Date>(new Date());

  /**
   * Détecte les histoires zombies (pending depuis trop longtemps)
   */
  const detectZombieStories = useCallback((): Story[] => {
    const now = Date.now();
    
    return stories.filter(story => {
      if (story.status !== 'pending') return false;
      
      const createdAt = new Date(story.createdAt).getTime();
      const ageMs = now - createdAt;
      
      // Vérifier si c'est un zombie
      const isZombie = ageMs > opts.zombieThresholdMs;
      
      // Vérifier si on n'a pas dépassé le nombre max de tentatives
      const attempts = recoveryAttemptsRef.current.get(story.id) || 0;
      const canRetry = attempts < opts.maxAutoRetries;
      
      return isZombie && canRetry;
    });
  }, [stories, opts.zombieThresholdMs, opts.maxAutoRetries]);

  /**
   * Tente de récupérer automatiquement une histoire zombie
   */
  const attemptAutoRecovery = useCallback(async (story: Story) => {
    const attempts = recoveryAttemptsRef.current.get(story.id) || 0;
    
    console.log(`[AutoRecovery] Tentative ${attempts + 1}/${opts.maxAutoRetries} pour: ${story.title}`);
    
    // Incrémenter le compteur avant la tentative
    recoveryAttemptsRef.current.set(story.id, attempts + 1);
    
    try {
      const success = await recoverStuckStory(story);
      
      if (success) {
        console.log(`[AutoRecovery] ✅ Récupération réussie: ${story.title}`);
      } else {
        console.warn(`[AutoRecovery] ⚠️ Récupération échouée: ${story.title}`);
        
        // Si on a atteint le max de tentatives
        if (attempts + 1 >= opts.maxAutoRetries) {
          toast({
            title: "⚠️ Récupération impossible",
            description: `"${story.title}" nécessite une intervention manuelle.`,
            variant: "destructive",
            duration: 8000,
          });
        }
      }
      
      return success;
    } catch (error: any) {
      console.error('[AutoRecovery] Erreur lors de la récupération:', error);
      
      // Si c'est la dernière tentative, notifier l'utilisateur
      if (attempts + 1 >= opts.maxAutoRetries) {
        toast({
          title: "❌ Échec de récupération",
          description: `Impossible de récupérer "${story.title}". Intervention manuelle requise.`,
          variant: "destructive",
          duration: 10000,
        });
      }
      
      return false;
    }
  }, [recoverStuckStory, toast, opts.maxAutoRetries]);

  /**
   * Vérifie et récupère les histoires zombies
   */
  const checkAndRecover = useCallback(async () => {
    if (!opts.enabled) return;

    const now = new Date();
    const timeSinceLastCheck = now.getTime() - lastCheckRef.current.getTime();
    
    // Ne vérifier que si l'intervalle est respecté
    if (timeSinceLastCheck < opts.checkIntervalMs) return;
    
    lastCheckRef.current = now;
    
    const zombies = detectZombieStories();
    
    if (zombies.length === 0) {
      console.log('[AutoRecovery] Aucune histoire zombie détectée');
      return;
    }

    console.log(`[AutoRecovery] ${zombies.length} histoire(s) zombie(s) détectée(s)`);
    
    // Récupérer les zombies avec un délai entre chaque tentative
    for (const zombie of zombies) {
      await attemptAutoRecovery(zombie);
      
      // Attendre 2 secondes entre chaque tentative pour éviter la surcharge
      if (zombies.indexOf(zombie) < zombies.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }, [opts.enabled, opts.checkIntervalMs, detectZombieStories, attemptAutoRecovery]);

  /**
   * Nettoyer les compteurs des histoires terminées
   */
  useEffect(() => {
    const completedOrErrorIds = stories
      .filter(s => s.status === 'completed' || s.status === 'error' || s.status === 'read')
      .map(s => s.id);
    
    completedOrErrorIds.forEach(id => {
      recoveryAttemptsRef.current.delete(id);
    });
  }, [stories]);

  /**
   * Vérification périodique automatique
   */
  useEffect(() => {
    if (!opts.enabled) return;

    console.log('[AutoRecovery] Système de récupération automatique activé');
    
    // Vérification initiale après 30 secondes
    const initialTimer = setTimeout(() => {
      checkAndRecover();
    }, 30000);

    // Vérifications périodiques
    const interval = setInterval(() => {
      checkAndRecover();
    }, opts.checkIntervalMs);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
      console.log('[AutoRecovery] Système de récupération automatique désactivé');
    };
  }, [opts.enabled, opts.checkIntervalMs, checkAndRecover]);

  /**
   * Réinitialiser le compteur pour une histoire spécifique
   */
  const resetRecoveryAttempts = useCallback((storyId: string) => {
    recoveryAttemptsRef.current.delete(storyId);
    console.log(`[AutoRecovery] Compteur réinitialisé pour: ${storyId}`);
  }, []);

  /**
   * Récupération manuelle (réinitialise le compteur)
   */
  const manualRecovery = useCallback(async (story: Story) => {
    console.log(`[AutoRecovery] Récupération manuelle demandée pour: ${story.title}`);
    resetRecoveryAttempts(story.id);
    return await recoverStuckStory(story);
  }, [recoverStuckStory, resetRecoveryAttempts]);

  return {
    checkAndRecover,
    resetRecoveryAttempts,
    manualRecovery,
    getRecoveryAttempts: (storyId: string) => recoveryAttemptsRef.current.get(storyId) || 0
  };
};
