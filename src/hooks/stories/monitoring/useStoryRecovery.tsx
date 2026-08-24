
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStoryRetry } from "../useStoryRetry";
import type { Story } from "@/types/story";

/**
 * Hook pour la récupération automatique des histoires échouées
 */
export const useStoryRecovery = () => {
  const { toast } = useToast();
  const { retryStoryGeneration } = useStoryRetry();

  const recoverStuckStory = useCallback(async (story: Story) => {
    try {
      console.log(`[StoryRecovery] Tentative de récupération pour: ${story.id}`);
      await retryStoryGeneration(story.id);
      return true;
    } catch (error: any) {
      console.error('[StoryRecovery] Erreur lors de la récupération:', error);
      return false;
    }
  }, [retryStoryGeneration]);

  const recoverAllFailedStories = useCallback(async (stories: Story[]) => {
    const failedStories = stories.filter(s => s.status === 'error');
    
    if (failedStories.length === 0) {
      return;
    }

    console.log(`[StoryRecovery] Récupération de ${failedStories.length} histoires échouées`);
    
    const results = await Promise.allSettled(
      failedStories.map(story => recoverStuckStory(story))
    );

    const successful = results.filter(r => r.status === 'fulfilled' && r.value).length;
    const failed = results.length - successful;

    toast({
      title: "Récupération terminée",
      description: `${successful} histoires relancées, ${failed} échecs.`,
      variant: successful > 0 ? "default" : "destructive",
    });
  }, [recoverStuckStory, toast]);

  return {
    recoverStuckStory,
    recoverAllFailedStories
  };
};
