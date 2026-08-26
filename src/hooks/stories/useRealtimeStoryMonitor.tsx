
import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { useN8nCompletionCallback } from './useN8nCompletionCallback';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import type { Story } from '@/types/story';

interface RealtimeStoryMonitorOptions {
  onStoryCreated?: (story: Story) => void;
  onTimeout?: () => void;
  timeoutMs?: number;
  enabled?: boolean;
}

export const useRealtimeStoryMonitor = (options: RealtimeStoryMonitorOptions = {}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringStartTime, setMonitoringStartTime] = useState<number | null>(null);
  const [lastDetectedStory, setLastDetectedStory] = useState<Story | null>(null);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { notifyStoryReady } = useStoryNotifications();

  const {
    onStoryCreated,
    onTimeout,
    timeoutMs = 600000, // 10 minutes par défaut - augmenté pour correspondre au temps de création
    enabled = true
  } = options;

  // Intégrer le monitoring des callbacks n8n
  const n8nCallback = useN8nCompletionCallback({
    onStoryCompleted: (storyId, storyData) => {
      console.log('[RealtimeStoryMonitor] Histoire complétée via callback n8n:', storyId);

      // Créer un objet Story temporaire pour la compatibilité
      const completedStory: Story = {
        id: storyId,
        title: storyData?.title || 'Histoire générée',
        content: '',
        preview: '',
        childrenIds: [],
        createdAt: new Date(),
        status: 'ready',
        story_summary: '',
        objective: ''
      };

      setLastDetectedStory(completedStory);
      setIsMonitoring(false);
      setMonitoringStartTime(null);

      if (onStoryCreated) {
        onStoryCreated(completedStory);
      }
    },
    enabled
  });

  const startMonitoring = useCallback((initialStoryCount?: number) => {
    if (!user || !enabled) {
      console.warn('[RealtimeStoryMonitor] Cannot start monitoring: user not authenticated or disabled');
      return;
    }

    console.log('[RealtimeStoryMonitor] Démarrage du monitoring en temps réel pour user:', user.id);
    setIsMonitoring(true);
    setMonitoringStartTime(Date.now());
    setLastDetectedStory(null);

    // Démarrer l'écoute des callbacks n8n
    const cleanupN8n = n8nCallback.startListening();

    // Créer un canal Supabase Realtime pour écouter les changements sur la table stories
    const channel = supabase
      .channel('story_realtime_monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'stories',
          filter: `authorid=eq.${user.id}`
        },
        (payload) => {
          console.log('[RealtimeStoryMonitor] SUCCÈS: Nouvelle histoire détectée en temps réel:', payload);

          const newStory = payload.new as any;
          const formattedStory: Story = {
            id: newStory.id,
            title: newStory.title || 'Histoire générée',
            content: newStory.content || '',
            preview: newStory.preview || newStory.summary || '',
            childrenIds: newStory.childrenids || [],
            createdAt: new Date(newStory.createdat),
            status: newStory.status || 'completed',
            story_summary: newStory.summary || '',
            objective: newStory.objective || ''
          };

          setLastDetectedStory(formattedStory);
          setIsMonitoring(false);
          setMonitoringStartTime(null);

          // 🚨 NOTIFICATION NATIVE : Histoire créée
          notifyStoryReady(formattedStory.title, formattedStory.id)
            .then(() => console.log('[RealtimeStoryMonitor] ✅ Notification native envoyée'))
            .catch(error => console.warn('[RealtimeStoryMonitor] ⚠️ Erreur notification:', error));

          if (onStoryCreated) {
            onStoryCreated(formattedStory);
          }

          // Nettoyer les canaux après détection
          supabase.removeChannel(channel);
          if (cleanupN8n) cleanupN8n();
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
        (payload) => {
          console.log('[RealtimeStoryMonitor] Histoire mise à jour détectée:', payload);

          const updatedStory = payload.new as any;

          // Vérifier si l'histoire est passée de 'pending' à 'completed'
          if (updatedStory.status === 'completed' && payload.old?.status === 'pending') {
            console.log('[RealtimeStoryMonitor] Histoire complétée détectée:', updatedStory.id);

            const formattedStory: Story = {
              id: updatedStory.id,
              title: updatedStory.title || 'Histoire générée',
              content: updatedStory.content || '',
              preview: updatedStory.preview || updatedStory.summary || '',
              childrenIds: updatedStory.childrenids || [],
              createdAt: new Date(updatedStory.createdat),
              status: updatedStory.status,
              story_summary: updatedStory.summary || '',
              objective: updatedStory.objective || ''
            };

            setLastDetectedStory(formattedStory);
            setIsMonitoring(false);
            setMonitoringStartTime(null);

            // 🚨 NOTIFICATION NATIVE : Histoire complétée
            notifyStoryReady(formattedStory.title, formattedStory.id)
              .then(() => console.log('[RealtimeStoryMonitor] ✅ Notification native envoyée (UPDATE)'))
              .catch(error => console.warn('[RealtimeStoryMonitor] ⚠️ Erreur notification (UPDATE):', error));

            if (onStoryCreated) {
              onStoryCreated(formattedStory);
            }

            // Nettoyer les canaux après détection
            supabase.removeChannel(channel);
            if (cleanupN8n) cleanupN8n();
          }
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeStoryMonitor] Statut de connexion Realtime:', status);

        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeStoryMonitor] Connexion Realtime établie avec succès');
        } else if (status === 'CHANNEL_ERROR') {
          console.warn('[RealtimeStoryMonitor] Erreur de connexion Realtime (non-critique, bascule sur polling)');
          setIsMonitoring(false);
          setMonitoringStartTime(null);
          // Pas de toast ici pour éviter d'effrayer l'utilisateur alors que le polling fonctionne
        }
      });

    // Nettoyage centralisé
    let isCleanedUp = false;
    let pollingIntervalId: NodeJS.Timeout | null = null;

    const completeStoryDetection = (formattedStory: Story) => {
      if (isCleanedUp) return;
      isCleanedUp = true;

      setLastDetectedStory(formattedStory);
      setIsMonitoring(false);
      setMonitoringStartTime(null);

      // Notification native
      notifyStoryReady(formattedStory.title, formattedStory.id)
        .then(() => console.log('[RealtimeStoryMonitor] ✅ Notification native envoyée'))
        .catch(error => console.warn('[RealtimeStoryMonitor] ⚠️ Erreur notification:', error));

      if (onStoryCreated) {
        onStoryCreated(formattedStory);
      }

      // Nettoyer
      if (pollingIntervalId) clearInterval(pollingIntervalId);
      supabase.removeChannel(channel);
      if (cleanupN8n) cleanupN8n();
    };

    // Polling de secours actif (toutes les 4 secondes) pour pallier les micro-coupures Realtime / mise en veille
    const checkDbForCompletedStory = async () => {
      if (isCleanedUp || !user) return;
      try {
        const { data: recentStories } = await supabase
          .from('stories')
          .select('*')
          .eq('authorid', user.id)
          .order('createdat', { ascending: false })
          .limit(3);

        if (recentStories && recentStories.length > 0) {
          for (const s of recentStories) {
            const createdAtTime = new Date(s.createdat).getTime();
            const hasValidContent = typeof s.content === 'string' && s.content.trim().length > 50;

            // Détection si l'histoire a été créée après le début du monitoring ET est complétée (ou avec contenu)
            if (monitoringStartTime && createdAtTime >= (monitoringStartTime - 10000)) {
              if (s.status === 'completed' || hasValidContent) {
                console.log('🔄 [RealtimeStoryMonitor] Histoire détectée via Polling de secours:', s.id);
                const formattedStory: Story = {
                  id: s.id,
                  title: s.title || 'Histoire générée',
                  content: s.content || '',
                  preview: s.preview || s.summary || '',
                  childrenIds: s.childrenids || [],
                  createdAt: new Date(s.createdat),
                  status: 'completed',
                  story_summary: s.summary || '',
                  objective: s.objective || ''
                };
                completeStoryDetection(formattedStory);
                return;
              }
            }
          }
        }
      } catch (err) {
        console.warn('[RealtimeStoryMonitor] Erreur lors du polling de secours (non-bloquant):', err);
      }
    };

    pollingIntervalId = setInterval(checkDbForCompletedStory, 4000);

    // Écouteurs de reprise au premier plan
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👁️ [RealtimeStoryMonitor] Retour au premier plan, vérification immédiate...');
        void checkDbForCompletedStory();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // Gérer le timeout global
    const timeoutId = setTimeout(() => {
      if (isMonitoring && monitoringStartTime && !isCleanedUp) {
        console.warn('[RealtimeStoryMonitor] TIMEOUT: Temps limite dépassé');
        isCleanedUp = true;
        setIsMonitoring(false);
        setMonitoringStartTime(null);

        if (pollingIntervalId) clearInterval(pollingIntervalId);
        supabase.removeChannel(channel);
        if (cleanupN8n) cleanupN8n();

        toast({
          title: "Création en cours",
          description: "La création prend plus de temps que prévu. Vérifiez votre bibliothèque dans quelques minutes.",
          variant: "default",
        });

        if (onTimeout) {
          onTimeout();
        }
      }
    }, timeoutMs);

    // Fonction de nettoyage
    return () => {
      isCleanedUp = true;
      clearTimeout(timeoutId);
      if (pollingIntervalId) clearInterval(pollingIntervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      supabase.removeChannel(channel);
      if (cleanupN8n) cleanupN8n();
      setIsMonitoring(false);
      setMonitoringStartTime(null);
    };
  }, [user, enabled, timeoutMs, onStoryCreated, onTimeout, toast, isMonitoring, monitoringStartTime, n8nCallback]);

  const stopMonitoring = useCallback(() => {
    console.log('[RealtimeStoryMonitor] Arrêt manuel du monitoring');
    setIsMonitoring(false);
    setMonitoringStartTime(null);
    n8nCallback.stopListening();
  }, [n8nCallback]);

  // Nettoyage automatique si l'utilisateur se déconnecte
  useEffect(() => {
    if (!user && isMonitoring) {
      stopMonitoring();
    }
  }, [user, isMonitoring, stopMonitoring]);

  return {
    isMonitoring: isMonitoring || n8nCallback.isListening,
    startMonitoring,
    stopMonitoring,
    lastDetectedStory,
    monitoringStartTime
  };
};
