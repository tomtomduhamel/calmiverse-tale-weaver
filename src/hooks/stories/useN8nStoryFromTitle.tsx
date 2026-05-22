import { useState } from 'react';
import type { Child } from '@/types/child';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import { getErrorMessage } from '@/utils/retryUtils';
import { supabase } from '@/integrations/supabase/client';
import { StoryDurationMinutes } from '@/types/story';
import type { TitleCostData } from '@/hooks/stories/useN8nTitleGeneration';

interface StoryCreationData {
  selectedTitle: string;
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
  childrenGenders: string[];
  children?: Child[];
  durationMinutes?: StoryDurationMinutes;
  titleGenerationCost?: TitleCostData | null;
  generateVideo?: boolean;
}

export const useN8nStoryFromTitle = () => {
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { notifyStoryError } = useStoryNotifications();

  const createStoryFromTitle = async (data: StoryCreationData): Promise<string> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsCreatingStory(true);

    try {
      console.log('[N8nStoryFromTitle] Création d\'histoire à partir du titre:', data.selectedTitle);

      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/816f3f78-bbdc-4b51-88b6-13232fcf3c78';

      // Assemblage serveur du payload (source unique partagée avec les routines auto)
      const { data: assembled, error: assembleError } = await supabase.functions.invoke('assemble-story-payload', {
        body: {
          mode: 'guided',
          objective: data.objective,
          childrenIds: data.childrenIds,
          selectedTitle: data.selectedTitle,
          durationMinutes: data.durationMinutes ?? null,
          generateVideo: data.generateVideo ?? false,
          titleGenerationCost: data.titleGenerationCost ?? null,
        },
      });

      if (assembleError) throw new Error(assembleError.message || "Erreur lors de l'assemblage du prompt");
      if (assembled?.error) throw new Error(assembled.error);

      const payload = assembled?.payload;
      if (!payload) throw new Error("Payload d'histoire vide");

      console.log('[N8nStoryFromTitle] Payload assemblé, source du prompt:', payload.promptSource);

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
      console.log('[N8nStoryFromTitle] Réponse n8n reçue:', result);

      // Retourner un identifiant de processus (le vrai storyId arrive via le callback n8n)
      const processId = result.processId || result.workflowId || `process-${Date.now()}`;
      console.log('[N8nStoryFromTitle] Processus n8n lancé avec ID:', processId);

      return processId;
    } catch (error: any) {
      console.error('[N8nStoryFromTitle] Erreur:', error);

      toast({
        title: "Erreur de création",
        description: getErrorMessage(error, "création d'histoire"),
        variant: "destructive",
      });

      try {
        await notifyStoryError(data.selectedTitle, 'creation-error');
      } catch (notifError) {
        console.warn('[N8nStoryFromTitle] ⚠️ Erreur notification:', notifError);
      }

      throw error;
    } finally {
      setIsCreatingStory(false);
    }
  };

  return {
    createStoryFromTitle,
    isCreatingStory
  };
};
