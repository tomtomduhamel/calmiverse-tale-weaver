
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";

interface UseMarkAsReadProps {
  story: Story | null;
  onMarkAsRead?: (storyId: string) => Promise<boolean>;
  setStory: (story: Story | null) => void;
}

export const useMarkAsRead = ({ story, onMarkAsRead, setStory }: UseMarkAsReadProps) => {
  const [isUpdatingReadStatus, setIsUpdatingReadStatus] = useState(false);
  const { toast } = useToast();

  const handleMarkAsRead = useCallback(async (storyId: string): Promise<boolean> => {
    if (story && onMarkAsRead) {
      try {
        console.log("[useMarkAsRead] DEBUG: Début toggle pour story:", storyId);
        console.log("[useMarkAsRead] DEBUG: Current story status:", story.status);
        
        setIsUpdatingReadStatus(true);
        
        // Appel API pour mettre à jour le statut côté serveur
        // La logique de toggle est maintenant dans StoryReaderPage
        const success = await onMarkAsRead(storyId);
        
        if (success) {
          // Le statut sera mis à jour par le parent (StoryReaderPage)
          const newStatus = story.status === "read" ? "completed" : "read";
          console.log("[useMarkAsRead] DEBUG: Success! New status should be:", newStatus);
          
          toast({
            title: newStatus === "read" ? "Histoire marquée comme lue" : "Histoire marquée comme non lue",
            description: "Le statut de l'histoire a été mis à jour"
          });
          return true;
        } else {
          console.log("[useMarkAsRead] DEBUG: Failed to update status");
          toast({
            title: "Erreur",
            description: "Impossible de mettre à jour le statut de l'histoire",
            variant: "destructive"
          });
          return false;
        }
      } catch (error) {
        console.error("[useMarkAsRead] ERROR: Error updating story status:", error);
        
        toast({
          title: "Erreur",
          description: "Une erreur s'est produite lors de la mise à jour",
          variant: "destructive"
        });
        return false;
      } finally {
        setIsUpdatingReadStatus(false);
      }
    }
    return false;
  }, [story, onMarkAsRead, toast]);

  return {
    isUpdatingReadStatus,
    handleMarkAsRead
  };
};
