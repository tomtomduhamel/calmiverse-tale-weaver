
import { useEffect, useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Story } from '@/types/story';

interface N8nCompletionCallbackOptions {
  onStoryCompleted?: (storyId: string, story?: Partial<Story>) => void;
  enabled?: boolean;
}

export const useN8nCompletionCallback = (options: N8nCompletionCallbackOptions = {}) => {
  const [isListening, setIsListening] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  
  const {
    onStoryCompleted,
    enabled = true
  } = options;

  const startListening = useCallback(() => {
    if (!user || !enabled) {
      console.warn('[N8nCompletionCallback] Cannot start listening: user not authenticated or disabled');
      return;
    }

    const channelName = `story_completion_${user.id}`;
    console.log('[N8nCompletionCallback] Starting to listen for n8n completion callbacks on channel:', channelName);
    
    setIsListening(true);

    // Créer un canal Supabase Realtime pour écouter les callbacks n8n
    const channel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'story_completion' }, (payload) => {
        console.log('[N8nCompletionCallback] SUCCÈS: Callback n8n reçu:', payload);
        
        const { storyId, title, status, source } = payload.payload;
        
        if (source === 'n8n_callback' && status === 'completed') {
          console.log('[N8nCompletionCallback] Histoire complétée via n8n:', storyId);
          
          toast({
            title: "Histoire complétée",
            description: `"${title || 'Votre histoire'}" est maintenant prête`,
          });

          if (onStoryCompleted) {
            onStoryCompleted(storyId, {
              id: storyId,
              title: title || 'Histoire générée',
              status: 'ready'
            });
          }
        }
      })
      .subscribe((status) => {
        console.log('[N8nCompletionCallback] Statut de connexion Realtime:', status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[N8nCompletionCallback] Connexion Realtime établie avec succès');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[N8nCompletionCallback] Erreur de connexion Realtime');
          setIsListening(false);
          
          toast({
            title: "Erreur de connexion",
            description: "Impossible d'écouter les notifications de completion",
            variant: "destructive",
          });
        }
      });

    // Fonction de nettoyage
    return () => {
      console.log('[N8nCompletionCallback] Arrêt de l\'écoute des callbacks n8n');
      supabase.removeChannel(channel);
      setIsListening(false);
    };
  }, [user, enabled, onStoryCompleted, toast]);

  const stopListening = useCallback(() => {
    console.log('[N8nCompletionCallback] Arrêt manuel de l\'écoute');
    setIsListening(false);
  }, []);

  // Nettoyage automatique si l'utilisateur se déconnecte
  useEffect(() => {
    if (!user && isListening) {
      stopListening();
    }
  }, [user, isListening, stopListening]);

  return {
    isListening,
    startListening,
    stopListening
  };
};
