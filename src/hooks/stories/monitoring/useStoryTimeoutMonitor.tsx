
import { useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStoryUpdate } from "../useStoryUpdate";
import type { Story } from "@/types/story";

interface UseStoryTimeoutMonitorProps {
  stories: Story[];
  timeoutMinutes?: number;
}

/**
 * Hook pour surveiller et gérer les timeouts des histoires en génération
 */
export const useStoryTimeoutMonitor = ({ 
  stories, 
  timeoutMinutes = 5 
}: UseStoryTimeoutMonitorProps) => {
  const { toast } = useToast();
  const { updateStoryStatus } = useStoryUpdate();
  const checkedStoriesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const checkStoryTimeouts = async () => {
      const now = new Date();
      const timeoutMs = timeoutMinutes * 60 * 1000;

      for (const story of stories) {
        if (story.status === 'pending' && !checkedStoriesRef.current.has(story.id)) {
          const createdAt = new Date(story.createdAt);
          const timeDiff = now.getTime() - createdAt.getTime();

          if (timeDiff > timeoutMs) {
            console.log(`[StoryTimeout] Histoire en timeout détectée: ${story.id}, durée: ${Math.round(timeDiff / 1000 / 60)}min`);
            
            try {
              await updateStoryStatus(story.id, 'error', `Timeout: La génération a pris plus de ${timeoutMinutes} minutes`);
              
              toast({
                title: "Génération échouée",
                description: `L'histoire "${story.title}" a pris trop de temps à se générer et a été marquée en erreur.`,
                variant: "destructive",
              });

              // Marquer comme vérifiée pour éviter les notifications répétées
              checkedStoriesRef.current.add(story.id);
            } catch (error) {
              console.error('[StoryTimeout] Erreur lors de la mise à jour du statut:', error);
            }
          }
        }
      }
    };

    // Vérifier les timeouts toutes les 30 secondes
    const interval = setInterval(checkStoryTimeouts, 30000);
    
    // Vérifier immédiatement
    checkStoryTimeouts();

    return () => clearInterval(interval);
  }, [stories, timeoutMinutes, updateStoryStatus, toast]);

  // Nettoyer les références d'histoires qui ne sont plus en pending
  useEffect(() => {
    const pendingIds = new Set(
      stories.filter(s => s.status === 'pending').map(s => s.id)
    );
    
    // Garder seulement les IDs qui sont encore en pending
    checkedStoriesRef.current = new Set(
      Array.from(checkedStoriesRef.current).filter(id => pendingIds.has(id))
    );
  }, [stories]);

  return {
    checkedStories: checkedStoriesRef.current.size
  };
};
