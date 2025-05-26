
import { useCallback } from "react";
import { useLocation } from "react-router-dom";
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
  const location = useLocation();

  const handleSelectStory = useCallback((story: Story) => {
    console.log("[useStorySelection] DEBUG: Sélection d'histoire:", story.id, "status:", story.status);
    
    // Définir l'histoire courante IMMÉDIATEMENT
    setCurrentStory(story);
    console.log("[useStorySelection] DEBUG: Histoire courante définie:", story.id);
    
    // Changer la vue vers reader IMMÉDIATEMENT
    console.log("[useStorySelection] DEBUG: Changement de vue vers 'reader'");
    setCurrentView("reader");
    
    // Marquer l'histoire comme lue si nécessaire (en arrière-plan)
    if (story.status === "ready") {
      console.log("[useStorySelection] DEBUG: Marquage de l'histoire comme lue en arrière-plan");
      handleMarkAsRead(story.id).catch(error => {
        console.error("[useStorySelection] ERROR: Erreur lors du marquage de l'histoire comme lue:", error);
      });
    }
  }, [setCurrentStory, setCurrentView, handleMarkAsRead]);

  return { handleSelectStory };
};
