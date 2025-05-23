
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
        // Optimistic UI update - mettre à jour l'interface avant la confirmation serveur
        setIsUpdatingReadStatus(true);
        
        // Sauvegarde du statut original
        const originalStatus = story.status;
        
        // Mise à jour optimiste du state local
        setStory({ ...story, status: "read" as Story["status"] });
        
        // Appel API pour mettre à jour le statut côté serveur
        const success = await onMarkAsRead(storyId);
        
        if (success) {
          toast({
            title: "Histoire marquée comme lue",
            description: "Le statut de l'histoire a été mis à jour"
          });
          return true;
        } else {
          // En cas d'échec, restaurer l'état précédent
          setStory({ ...story, status: originalStatus });
          
          toast({
            title: "Erreur",
            description: "Impossible de marquer l'histoire comme lue",
            variant: "destructive"
          });
          return false;
        }
      } catch (error) {
        console.error("Error marking story as read:", error);
        // Restaurer l'état en cas d'erreur
        if (story) {
          setStory({ ...story });
        }
        
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
  }, [story, onMarkAsRead, setStory, toast]);

  return {
    isUpdatingReadStatus,
    handleMarkAsRead
  };
};
