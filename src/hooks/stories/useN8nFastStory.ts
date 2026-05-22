import { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import { supabase } from '@/integrations/supabase/client';
import type { StoryDurationMinutes } from '@/types/story';

export interface FastStoryCreationData {
  promptKey: string;
  durationMinutes: StoryDurationMinutes;
  generateVideo?: boolean;
}

export const useN8nFastStory = () => {
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const { user } = useSupabaseAuth();
  const { notifyStoryError } = useStoryNotifications();

  const createFastStory = async (data: FastStoryCreationData): Promise<string> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsCreatingStory(true);

    try {
      console.log('[N8nFastStory] Création d\'histoire rapide:', data);

      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/816f3f78-bbdc-4b51-88b6-13232fcf3c78';

      // Assemblage serveur du payload (source unique partagée avec les routines auto)
      const { data: assembled, error: assembleError } = await supabase.functions.invoke('assemble-story-payload', {
        body: {
          mode: 'fast',
          fastStoryPromptKey: data.promptKey,
          durationMinutes: data.durationMinutes,
          generateVideo: data.generateVideo ?? false,
        },
      });

      if (assembleError) throw new Error(assembleError.message || "Erreur lors de l'assemblage du prompt");
      if (assembled?.error) throw new Error(assembled.error);

      const payload = assembled?.payload;
      if (!payload) throw new Error("Payload d'histoire vide");

      console.log('[N8nFastStory] Payload assemblé pour le thème:', data.promptKey);

      let result;
      let retries = 0;
      let success = false;

      while (!success && retries < 3) {
        try {
          const { data: triggerData, error } = await supabase.functions.invoke('trigger-n8n', {
            body: { targetUrl: webhookUrl, payload }
          });

          if (error) throw new Error(error.message || "Erreur Supabase function proxy");
          if (triggerData?.error) throw new Error(triggerData.error);

          result = triggerData;
          success = true;
        } catch (err: any) {
          const msg = err?.message?.toLowerCase() || '';
          if (msg.includes('timeout') || msg.includes('network') || msg.includes('connexion') || msg.includes('proxy')) {
            retries++;
            if (retries >= 3) throw err;
            await new Promise(r => setTimeout(r, 2000 * Math.pow(2, retries))); // Exponential backoff
          } else {
            throw err;
          }
        }
      }

      console.log('[N8nFastStory] Réponse n8n:', result);

      const processId = result.processId || result.workflowId || `fast-process-${Date.now()}`;
      return processId;

    } catch (error: any) {
      console.error('[N8nFastStory] Erreur:', error);

      try {
        await notifyStoryError('Histoire rapide', 'creation-error');
      } catch (notifError) {
        console.warn('[N8nFastStory] ⚠️ Erreur notification:', notifError);
      }

      throw error;
    } finally {
      setIsCreatingStory(false);
    }
  };

  return { createFastStory, isCreatingStory };
};
