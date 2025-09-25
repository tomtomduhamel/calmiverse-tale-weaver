import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Story } from '@/types/story';

interface BackgroundStoryGenerationState {
  activeGenerations: Array<{
    id: string;
    title: string;
    startTime: Date;
    status: 'pending' | 'completed' | 'error';
  }>;
  totalActiveCount: number;
}

/**
 * Hook pour gérer la génération d'histoires en arrière-plan
 * Permet à l'utilisateur de naviguer librement pendant la génération
 */
export const useBackgroundStoryGeneration = () => {
  const [state, setState] = useState<BackgroundStoryGenerationState>({
    activeGenerations: [],
    totalActiveCount: 0
  });
  
  // Utilisation du client Supabase global
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  // Démarrer le suivi d'une nouvelle génération
  const startGeneration = useCallback((storyId: string, title: string = 'Histoire en cours') => {
    setState(prev => ({
      ...prev,
      activeGenerations: [
        ...prev.activeGenerations,
        {
          id: storyId,
          title,
          startTime: new Date(),
          status: 'pending'
        }
      ],
      totalActiveCount: prev.totalActiveCount + 1
    }));
    
    console.log('[useBackgroundStoryGeneration] Génération démarrée:', storyId);
  }, []);

  // Marquer une génération comme terminée
  const completeGeneration = useCallback(async (storyId: string, story?: Story) => {
    setState(prev => ({
      ...prev,
      activeGenerations: prev.activeGenerations.map(gen =>
        gen.id === storyId 
          ? { ...gen, status: 'completed' }
          : gen
      )
    }));

    // Utiliser le service de notifications PWA natif
    try {
      const { notificationService } = await import('@/services/notifications/NotificationService');
      if (story?.title) {
        await notificationService.notifyStoryReady(story.title, storyId);
      } else {
        await notificationService.notifyGeneralUpdate(
          '✨ Histoire terminée !',
          'Votre histoire personnalisée est maintenant disponible'
        );
      }
    } catch (error) {
      console.warn('Notification failed, using toast fallback:', error);
      // Fallback avec toast
      try {
        toast({
          title: "✨ Histoire terminée !",
          description: story?.title || 'Votre histoire est maintenant disponible'
        });
      } catch (toastError) {
        console.warn('Toast fallback also failed:', toastError);
      }
    }

    console.log('[useBackgroundStoryGeneration] Génération terminée:', storyId);
  }, [toast]);

  // Marquer une génération comme échouée
  const failGeneration = useCallback((storyId: string, error?: string) => {
    setState(prev => ({
      ...prev,
      activeGenerations: prev.activeGenerations.map(gen =>
        gen.id === storyId 
          ? { ...gen, status: 'error' }
          : gen
      )
    }));

    toast({
      title: "Erreur de génération",
      description: error || "Une erreur est survenue lors de la création de l'histoire",
      variant: "destructive"
    });

    console.log('[useBackgroundStoryGeneration] Génération échouée:', storyId, error);
  }, [toast]);

  // Nettoyer les anciennes générations terminées
  const cleanupOldGenerations = useCallback(() => {
    const now = new Date();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    setState(prev => ({
      ...prev,
      activeGenerations: prev.activeGenerations.filter(gen => {
        const age = now.getTime() - gen.startTime.getTime();
        return gen.status === 'pending' || age < maxAge;
      })
    }));
  }, []);

  // Surveillance en temps réel des histoires via Supabase
  useEffect(() => {
    if (!user || !supabase) return;

    console.log('[useBackgroundStoryGeneration] Démarrage de la surveillance temps réel');
    
    let channel: any = null;

    try {
      channel = supabase
        .channel('stories_realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'stories',
            filter: `authorid=eq.${user.id}`
          },
          (payload) => {
            try {
              console.log('[useBackgroundStoryGeneration] Changement détecté:', payload);
              
              const story = payload.new as Story;
              if (!story) return;

              // Vérifier si c'est une histoire que nous suivons
              const isTracked = state.activeGenerations.some(gen => gen.id === story.id);
              
              if (isTracked) {
                if (story.status === 'completed') {
                  completeGeneration(story.id, story);
                } else if (story.status === 'error') {
                  failGeneration(story.id, story.error);
                }
              }
            } catch (error) {
              console.warn('[useBackgroundStoryGeneration] Erreur traitement changement:', error);
            }
          }
        )
        .subscribe();
    } catch (error) {
      console.warn('[useBackgroundStoryGeneration] Erreur subscription Supabase:', error);
    }

    return () => {
      try {
        if (channel) {
          supabase.removeChannel(channel);
        }
      } catch (error) {
        console.warn('[useBackgroundStoryGeneration] Erreur cleanup channel:', error);
      }
    };
  }, [user, supabase, state.activeGenerations, completeGeneration, failGeneration]);

  // Nettoyage périodique
  useEffect(() => {
    const interval = setInterval(cleanupOldGenerations, 60000); // Toutes les minutes
    return () => clearInterval(interval);
  }, [cleanupOldGenerations]);

  return {
    ...state,
    startGeneration,
    completeGeneration,
    failGeneration,
    cleanupOldGenerations
  };
};