
import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
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
  
  const {
    onStoryCreated,
    onTimeout,
    timeoutMs = 120000, // 2 minutes par défaut
    enabled = true
  } = options;

  const startMonitoring = useCallback((initialStoryCount?: number) => {
    if (!user || !enabled) {
      console.warn('[RealtimeStoryMonitor] Cannot start monitoring: user not authenticated or disabled');
      return;
    }

    console.log('[RealtimeStoryMonitor] Démarrage du monitoring en temps réel pour user:', user.id);
    setIsMonitoring(true);
    setMonitoringStartTime(Date.now());
    setLastDetectedStory(null);

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

          toast({
            title: "Histoire créée avec succès",
            description: "Votre histoire est maintenant disponible dans votre bibliothèque",
          });

          if (onStoryCreated) {
            onStoryCreated(formattedStory);
          }

          // Nettoyer le canal après détection
          supabase.removeChannel(channel);
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

            toast({
              title: "Histoire complétée",
              description: "Votre histoire est maintenant prête à être lue",
            });

            if (onStoryCreated) {
              onStoryCreated(formattedStory);
            }

            // Nettoyer le canal après détection
            supabase.removeChannel(channel);
          }
        }
      )
      .subscribe((status) => {
        console.log('[RealtimeStoryMonitor] Statut de connexion Realtime:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[RealtimeStoryMonitor] Connexion Realtime établie avec succès');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[RealtimeStoryMonitor] Erreur de connexion Realtime');
          setIsMonitoring(false);
          setMonitoringStartTime(null);
          
          toast({
            title: "Erreur de monitoring",
            description: "Impossible de surveiller la création en temps réel",
            variant: "destructive",
          });
        }
      });

    // Gérer le timeout
    const timeoutId = setTimeout(() => {
      if (isMonitoring && monitoringStartTime) {
        console.warn('[RealtimeStoryMonitor] TIMEOUT: Temps limite dépassé');
        setIsMonitoring(false);
        setMonitoringStartTime(null);
        
        supabase.removeChannel(channel);
        
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
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
      setIsMonitoring(false);
      setMonitoringStartTime(null);
    };
  }, [user, enabled, timeoutMs, onStoryCreated, onTimeout, toast, isMonitoring, monitoringStartTime]);

  const stopMonitoring = useCallback(() => {
    console.log('[RealtimeStoryMonitor] Arrêt manuel du monitoring');
    setIsMonitoring(false);
    setMonitoringStartTime(null);
  }, []);

  // Nettoyage automatique si l'utilisateur se déconnecte
  useEffect(() => {
    if (!user && isMonitoring) {
      stopMonitoring();
    }
  }, [user, isMonitoring, stopMonitoring]);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    lastDetectedStory,
    monitoringStartTime
  };
};
