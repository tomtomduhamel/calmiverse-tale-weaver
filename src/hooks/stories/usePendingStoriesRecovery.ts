import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

const PENDING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

export interface PendingRecoveryResult {
  recoveredCount: number;
  timedOutCount: number;
}

/**
 * Hook de self-healing pour détecter et réparer silencieusement
 * les histoires bloquées en statut 'pending'
 */
export const usePendingStoriesRecovery = () => {
  const { user } = useSupabaseAuth();
  const [isRecovering, setIsRecovering] = useState(false);
  const isRunningRef = useRef(false);

  const checkAndRecoverPendingStories = useCallback(async (): Promise<PendingRecoveryResult> => {
    if (!user || isRunningRef.current) {
      return { recoveredCount: 0, timedOutCount: 0 };
    }

    isRunningRef.current = true;
    setIsRecovering(true);

    let recoveredCount = 0;
    let timedOutCount = 0;

    try {
      // 1. Récupérer les histoires en statut 'pending' de l'utilisateur
      const { data: pendingStories, error } = await supabase
        .from('stories')
        .select('id, title, content, status, createdat')
        .eq('authorid', user.id)
        .eq('status', 'pending');

      if (error || !pendingStories || pendingStories.length === 0) {
        return { recoveredCount: 0, timedOutCount: 0 };
      }

      console.log(`🧹 [Self-Healing] Vérification de ${pendingStories.length} histoire(s) en 'pending'...`);
      const now = Date.now();

      for (const story of pendingStories) {
        const createdAtTime = new Date(story.createdat).getTime();
        const ageMs = now - createdAtTime;
        const hasContent = typeof story.content === 'string' && story.content.trim().length > 50;

        if (hasContent) {
          // CAS 1 : Le contenu est présent en base, mais le statut est resté 'pending' -> Réparation en 'completed'
          console.log(`✨ [Self-Healing] Histoire ${story.id} réparée silencieusement : statut passé à 'completed'.`);
          const { error: updateErr } = await supabase
            .from('stories')
            .update({
              status: 'completed',
              updatedat: new Date().toISOString()
            })
            .eq('id', story.id)
            .eq('authorid', user.id);

          if (!updateErr) recoveredCount++;
        } else if (ageMs > PENDING_TIMEOUT_MS) {
          // CAS 2 : Temps limite dépassé (>10 min) sans contenu -> Marquage en 'error' propre pour permettre le retry
          console.warn(`⏰ [Self-Healing] Histoire ${story.id} expirée (>10 min) : statut passé à 'error'.`);
          const { error: updateErr } = await supabase
            .from('stories')
            .update({
              status: 'error',
              error: 'La génération a expiré sans réponse du serveur. Vous pouvez la relancer.',
              updatedat: new Date().toISOString()
            })
            .eq('id', story.id)
            .eq('authorid', user.id);

          if (!updateErr) timedOutCount++;
        }
      }

      if (recoveredCount > 0 || timedOutCount > 0) {
        console.log(`✅ [Self-Healing] Bilan de récupération : ${recoveredCount} réparée(s), ${timedOutCount} expirée(s).`);
      }

      return { recoveredCount, timedOutCount };
    } catch (err) {
      console.warn('[Self-Healing] Erreur silencieuse lors de la vérification des histoires:', err);
      return { recoveredCount: 0, timedOutCount: 0 };
    } finally {
      isRunningRef.current = false;
      setIsRecovering(false);
    }
  }, [user]);

  // Exécution automatique au montage et au retour au premier plan de l'application
  useEffect(() => {
    if (!user) return;

    // Exécution initiale différée de 2 secondes
    const timer = setTimeout(() => {
      void checkAndRecoverPendingStories();
    }, 2000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void checkAndRecoverPendingStories();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [user, checkAndRecoverPendingStories]);

  return {
    isRecovering,
    checkAndRecoverPendingStories
  };
};
