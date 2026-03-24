import { useState } from 'react';
import { ALL_FAST_STORIES } from '@/config/fastStoryConfig';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useActivePrompts } from '@/hooks/prompts';
import { useStoryVariation } from '@/hooks/stories/useStoryVariation';
import { useStoryNotifications } from '@/hooks/stories/useStoryNotifications';
import { supabase } from '@/integrations/supabase/client';
import { getErrorMessage } from '@/utils/retryUtils';
import { estimateWordCountForDuration } from '@/types/story';
import type { StoryDurationMinutes } from '@/types/story';
import { replacePromptVariables } from '@/utils/promptVariables';

export interface FastStoryCreationData {
  promptKey: string;
  durationMinutes: StoryDurationMinutes;
  generateVideo?: boolean;
}

export const useN8nFastStory = () => {
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const { user } = useSupabaseAuth();
  const { prompts } = useActivePrompts();
  const { selectVariation } = useStoryVariation();
  const { notifyStoryError } = useStoryNotifications();

  const createFastStory = async (data: FastStoryCreationData): Promise<string> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsCreatingStory(true);

    try {
      console.log('[N8nFastStory] Création d\'histoire rapide:', data);

      const targetWordCount = estimateWordCountForDuration(data.durationMinutes);

      // Sélection narrative aléatoire (pas d'âge ni d'objectif réel, on utilise un âge moyen 6 ans)
      const variation = selectVariation(6, data.promptKey);

      // Récupérer le prompt spécifique à l'émotion/situation depuis la DB
      const storyPromptRaw = prompts?.[data.promptKey];
      if (!storyPromptRaw) {
        console.warn(`[N8nFastStory] ⚠️ Prompt '${data.promptKey}' non trouvé. Utilisation d\'un prompt par défaut.`);
      }

      // Inject narrative variation variables if the template supports them
      const storyPrompt = storyPromptRaw
        ? replacePromptVariables(storyPromptRaw, {
            target_word_count: targetWordCount?.toString() || '1500',
            duration_minutes: data.durationMinutes.toString(),
            narrative_schema: variation?.narrativeSchema?.type || '',
            narrative_mechanism: variation?.narrativeSchema?.mechanism || '',
            vakog_focus: variation?.vakogFocus?.sensory_type || '',
            vakog_keywords: variation?.vakogFocus?.sensory_keywords?.join(', ') || '',
            symbolic_universe: variation?.symbolicUniverse?.name || '',
            symbolic_description: variation?.symbolicUniverse?.description || '',
            symbolic_visual_style: variation?.symbolicUniverse?.visual_style || '',
            ericksonian_technique: variation?.ericksonianTechnique?.name || '',
            ericksonian_pattern: variation?.ericksonianTechnique?.linguistic_pattern || '',
          })
        : `Génère une histoire courte (${targetWordCount} mots) pour un enfant d'environ 6 ans, avec un protagoniste surprise adapté au thème : ${data.promptKey}.`;

      // Récupérer prompts image et vidéo
      const imageGenerationPrompt = prompts?.image_generation_prompt || null;
      const videoGenerationPrompt = prompts?.video_generation_prompt || null;

      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook/816f3f78-bbdc-4b51-88b6-13232fcf3c78';

      const payload = {
        action: 'create_fast_story',
        is_fast_story: true,                    // Flag principal pour n8n
        fast_story_prompt_key: data.promptKey,  // Clé de l'émotion/situation
        objective: 'custom',                    // Objectif interne pour musique/DB
        durationMinutes: data.durationMinutes,
        targetWordCount,
        userId: user.id,
        userEmail: user.email,
        storyPrompt,
        imageGenerationPrompt,
        videoGenerationPrompt: data.generateVideo ? videoGenerationPrompt : null,
        generateVideo: data.generateVideo ?? false,
        narrativeVariation: {
          schema: variation.narrativeSchema?.type || null,
          vakog: variation.vakogFocus?.sensory_type || null,
          universe: variation.symbolicUniverse?.name || null,
          technique: variation.ericksonianTechnique?.name || null,
          theme: ALL_FAST_STORIES.find(item => item.promptKey === data.promptKey)?.label || null,
        },
        timestamp: new Date().toISOString(),
        requestId: `fast-story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      };

      console.log('[N8nFastStory] Envoi vers n8n:', payload);

      let result;
      let retries = 0;
      let success = false;
      let lastError;

      while (!success && retries < 3) {
        try {
          const { data, error } = await supabase.functions.invoke('trigger-n8n', {
            body: { targetUrl: webhookUrl, payload }
          });

          if (error) throw new Error(error.message || "Erreur Supabase function proxy");
          if (data?.error) throw new Error(data.error);
          
          result = data;
          success = true;
        } catch (err: any) {
          lastError = err;
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
