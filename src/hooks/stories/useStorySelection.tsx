
import { useCallback } from "react";
import type { Story } from "@/types/story";
import type { ViewType } from "@/types/views";

interface UseStorySelectionProps {
  setCurrentStory: (story: Story | null) => void;
  setCurrentView: (view: ViewType) => void;
  handleMarkAsRead: (storyId: string) => Promise<boolean>;
}

/**
 * Hook spécialisé pour gérer la sélection et l'affichage des histoires
 */
export const useStorySelection = ({
  setCurrentStory,
  setCurrentView,
  handleMarkAsRead
}: UseStorySelectionProps) => {

  const handleSelectStory = useCallback((story: Story) => {
    console.log("[useStorySelection] DEBUG: Sélection directe d'histoire:", story.id, "status:", story.status);
    
    setCurrentStory(story);
    console.log("[useStorySelection] DEBUG: Histoire courante définie:", story.id);
    
    // Utilisation d'un setTimeout pour garantir que l'état est bien mis à jour
    setTimeout(() => {
      console.log("[useStorySelection] DEBUG: Changement de vue vers 'reader'");
      setCurrentView("reader");
    }, 50);
    
    // Marquer l'histoire comme lue si nécessaire
    if (story.status === "ready") {
      console.log("[useStorySelection] DEBUG: Marquage de l'histoire comme lue");
      handleMarkAsRead(story.id).catch(error => {
        console.error("[useStorySelection] ERROR: Erreur lors du marquage de l'histoire comme lue:", error);
      });
    }
  }, [setCurrentStory, setCurrentView, handleMarkAsRead]);

  return { handleSelectStory };
};
