import { useEffect, useCallback, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import type { Story } from '@/types/story';

/**
 * Hook pour surveiller en permanence les nouvelles histoires créées
 * et envoyer des notifications natives en arrière-plan
 * Fonctionne même quand l'utilisateur navigue dans l'app
 */
export const useBackgroundStoryMonitor = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastKnownStoryCount, setLastKnownStoryCount] = useState<number>(0);
  const { user } = useSupabaseAuth();
  const { notifyStoryReady } = useStoryNotifications();
  const monitoringRef = useRef<{ intervalId?: NodeJS.Timeout; channelRef?: any }>({});

  /**
   * Récupère le nombre d'histoires actuelles pour l'utilisateur
   */
  const getCurrentStoryCount = useCallback(async (): Promise<number> => {
    if (!user) return 0;

    try {
      const { count, error } = await supabase
        .from('stories')
        .select('*', { count: 'exact', head: true })
        .eq('authorid', user.id);

      if (error) {
        console.error('[BackgroundStoryMonitor] Erreur comptage histoires:', error);
        return lastKnownStoryCount;
      }

      return count || 0;
    } catch (error) {
      console.error('[BackgroundStoryMonitor] Exception comptage histoires:', error);
      return lastKnownStoryCount;
    }
  }, [user, lastKnownStoryCount]);

  /**
   * Vérifie s'il y a de nouvelles histoires et envoie des notifications
   */
  const checkForNewStories = useCallback(async () => {
    if (!user || !isMonitoring) return;

    try {
      const currentCount = await getCurrentStoryCount();
      
      if (currentCount > lastKnownStoryCount) {
        console.log('[BackgroundStoryMonitor] 🎉 Nouvelles histoires détectées:', {
          previous: lastKnownStoryCount,
          current: currentCount,
          new: currentCount - lastKnownStoryCount
        });

        // Récupérer les nouvelles histoires pour notification
        const { data: newStories, error } = await supabase
          .from('stories')
          .select('id, title, createdat')
          .eq('authorid', user.id)
          .order('createdat', { ascending: false })
          .limit(currentCount - lastKnownStoryCount);

        if (!error && newStories && newStories.length > 0) {
          // Envoyer une notification pour chaque nouvelle histoire
          for (const story of newStories) {
            try {
              await notifyStoryReady(story.title, story.id);
              console.log('[BackgroundStoryMonitor] ✅ Notification envoyée pour:', story.title);
            } catch (notifError) {
              console.warn('[BackgroundStoryMonitor] ⚠️ Erreur notification:', notifError);
            }
          }
        }

        setLastKnownStoryCount(currentCount);
      }
    } catch (error) {
      console.error('[BackgroundStoryMonitor] Erreur vérification nouvelles histoires:', error);
    }
  }, [user, isMonitoring, lastKnownStoryCount, getCurrentStoryCount, notifyStoryReady]);

  /**
   * Démarre le monitoring en arrière-plan avec Realtime + Polling
   */
  const startBackgroundMonitoring = useCallback(async () => {
    if (!user || isMonitoring) return;

    console.log('[BackgroundStoryMonitor] 🚀 Démarrage monitoring background');
    setIsMonitoring(true);

    // Initialiser le compteur de base
    const initialCount = await getCurrentStoryCount();
    setLastKnownStoryCount(initialCount);

    // 1. Monitoring Realtime (priorité haute)
    const channel = supabase
      .channel('background_story_monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories',
          filter: `authorid=eq.${user.id}`
        },
        async (payload) => {
          console.log('[BackgroundStoryMonitor] 🔥 Realtime: Nouvelle histoire détectée!', payload);
          
          const newStory = payload.new as any;
          try {
            await notifyStoryReady(newStory.title || 'Nouvelle histoire', newStory.id);
            console.log('[BackgroundStoryMonitor] ✅ Notification Realtime envoyée');
            
            // Mettre à jour le compteur
            const newCount = await getCurrentStoryCount();
            setLastKnownStoryCount(newCount);
          } catch (error) {
            console.warn('[BackgroundStoryMonitor] ⚠️ Erreur notification Realtime:', error);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stories',
          filter: `authorid=eq.${user.id}`
        },
        async (payload) => {
          const updatedStory = payload.new as any;
          const oldStory = payload.old as any;
          
          // Détecter les histoires qui passent de 'pending' à 'completed'
          if (updatedStory.status === 'completed' && oldStory?.status === 'pending') {
            console.log('[BackgroundStoryMonitor] 🎯 Histoire complétée détectée:', updatedStory.title);
            
            try {
              await notifyStoryReady(updatedStory.title || 'Histoire complétée', updatedStory.id);
              console.log('[BackgroundStoryMonitor] ✅ Notification completion envoyée');
            } catch (error) {
              console.warn('[BackgroundStoryMonitor] ⚠️ Erreur notification completion:', error);
            }
          }
        }
      )
      .subscribe();

    monitoringRef.current.channelRef = channel;

    // 2. Polling de sécurité (toutes les 2 minutes)
    const intervalId = setInterval(() => {
      checkForNewStories();
    }, 120000); // 2 minutes

    monitoringRef.current.intervalId = intervalId;

    console.log('[BackgroundStoryMonitor] ✅ Monitoring actif (Realtime + Polling)');
  }, [user, isMonitoring, getCurrentStoryCount, checkForNewStories, notifyStoryReady]);

  /**
   * Arrête le monitoring
   */
  const stopBackgroundMonitoring = useCallback(() => {
    console.log('[BackgroundStoryMonitor] 🛑 Arrêt monitoring background');
    
    if (monitoringRef.current.intervalId) {
      clearInterval(monitoringRef.current.intervalId);
      monitoringRef.current.intervalId = undefined;
    }

    if (monitoringRef.current.channelRef) {
      supabase.removeChannel(monitoringRef.current.channelRef);
      monitoringRef.current.channelRef = undefined;
    }

    setIsMonitoring(false);
  }, []);

  // Auto-start/stop basé sur l'authentification
  useEffect(() => {
    if (user) {
      startBackgroundMonitoring();
    } else {
      stopBackgroundMonitoring();
    }

    return () => {
      stopBackgroundMonitoring();
    };
  }, [user, startBackgroundMonitoring, stopBackgroundMonitoring]);

  // Cleanup à la fermeture
  useEffect(() => {
    return () => {
      stopBackgroundMonitoring();
    };
  }, [stopBackgroundMonitoring]);

  return {
    isMonitoring,
    lastKnownStoryCount,
    startBackgroundMonitoring,
    stopBackgroundMonitoring,
    checkForNewStories
  };
};