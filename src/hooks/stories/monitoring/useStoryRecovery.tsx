
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
      
      toast({
        title: "Récupération en cours",
        description: `Tentative de récupération de l'histoire "${story.title}"...`,
      });

      await retryStoryGeneration(story.id);
      
      toast({
        title: "Récupération initiée",
        description: `La génération de "${story.title}" a été relancée.`,
      });

      return true;
    } catch (error: any) {
      console.error('[StoryRecovery] Erreur lors de la récupération:', error);
      
      toast({
        title: "Échec de la récupération",
        description: `Impossible de récupérer "${story.title}": ${error.message}`,
        variant: "destructive",
      });

      return false;
    }
  }, [retryStoryGeneration, toast]);

  const recoverAllFailedStories = useCallback(async (stories: Story[]) => {
    const failedStories = stories.filter(s => s.status === 'error');
    
    if (failedStories.length === 0) {
      toast({
        title: "Aucune histoire à récupérer",
        description: "Toutes les histoires sont dans un état normal.",
      });
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
