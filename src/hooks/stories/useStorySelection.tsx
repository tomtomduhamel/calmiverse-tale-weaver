
import { useCallback } from "react";
import { useAppNavigation } from "@/hooks/navigation/useAppNavigation";
import type { Story } from "@/types/story";

interface UseStorySelectionProps {
  handleMarkAsRead: (storyId: string) => Promise<boolean>;
}

/**
 * Hook simplifié pour gérer la sélection des histoires
 * Utilise maintenant useAppNavigation pour une navigation cohérente
 */
export const useStorySelection = ({
  handleMarkAsRead
}: UseStorySelectionProps) => {
  const { navigateToStory } = useAppNavigation();

  const handleSelectStory = useCallback((story: Story) => {
    console.log("[useStorySelection] Sélection d'histoire:", story.id, "status:", story.status);
    
    // Navigation immédiate vers l'histoire
    navigateToStory(story.id);
    
    // Marquer l'histoire comme lue si nécessaire (en arrière-plan)
    if (story.status === "ready") {
      console.log("[useStorySelection] Marquage de l'histoire comme lue en arrière-plan");
      handleMarkAsRead(story.id).catch(error => {
        console.error("[useStorySelection] Erreur lors du marquage de l'histoire comme lue:", error);
      });
    }
  }, [navigateToStory, handleMarkAsRead]);

  return { handleSelectStory };
};
