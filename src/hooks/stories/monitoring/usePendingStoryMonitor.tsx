
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";

interface UsePendingStoryMonitorProps {
  stories: Array<Story> | undefined;
  fetchStories: () => void;
  onStoryCompleted: (story: Story) => void;
}

/**
 * Hook spécialisé pour surveiller l'état des histoires en cours de génération
 */
export const usePendingStoryMonitor = ({ 
  stories, 
  fetchStories, 
  onStoryCompleted 
}: UsePendingStoryMonitorProps) => {
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!pendingStoryId || !stories) return;
    
    const pendingStory = stories.find(story => story.id === pendingStoryId);
    
    if (pendingStory) {
      if (pendingStory.status === "ready") {
        console.log("Story completed, displaying...");
        setPendingStoryId(null);
        onStoryCompleted(pendingStory);
        
        toast({
          title: "Histoire prête",
          description: "Votre histoire personnalisée est maintenant prête à être lue!",
        });
      } else if (pendingStory.status === 'error') {
        console.log("Error in story generation");
        setPendingStoryId(null);
        
        toast({
          title: "Erreur",
          description: "Une erreur est survenue lors de la génération de l'histoire",
          variant: "destructive",
        });
      }
    }
    
    const interval = setInterval(() => {
      if (pendingStoryId) {
        console.log("Checking story status:", pendingStoryId);
        fetchStories();
      }
    }, 5000);
    
    return () => clearInterval(interval);
  }, [pendingStoryId, stories, onStoryCompleted, toast, fetchStories]);

  return {
    pendingStoryId,
    setPendingStoryId
  };
};
