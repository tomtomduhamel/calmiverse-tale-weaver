
import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { Story } from "@/types/story";

interface UseStorySelectionProps {
  handleMarkAsRead: (storyId: string) => Promise<boolean>;
}

/**
 * Hook spécialisé pour gérer la sélection et l'affichage des histoires
 * Maintenant utilise React Router pour naviguer vers /reader/:id
 */
export const useStorySelection = ({
  handleMarkAsRead
}: UseStorySelectionProps) => {
  const navigate = useNavigate();

  const handleSelectStory = useCallback((story: Story) => {
    console.log("[useStorySelection] DEBUG: Sélection d'histoire:", story.id, "status:", story.status);
    
    // Navigation directe vers la route dédiée du lecteur
    console.log("[useStorySelection] DEBUG: Navigation vers /reader/", story.id);
    navigate(`/reader/${story.id}`);
    
    // Marquer l'histoire comme lue si nécessaire (en arrière-plan)
    if (story.status === "ready") {
      console.log("[useStorySelection] DEBUG: Marquage de l'histoire comme lue en arrière-plan");
      handleMarkAsRead(story.id).catch(error => {
        console.error("[useStorySelection] ERROR: Erreur lors du marquage de l'histoire comme lue:", error);
      });
    }
  }, [navigate, handleMarkAsRead]);

  return { handleSelectStory };
};
