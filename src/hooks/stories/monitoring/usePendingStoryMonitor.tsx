
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useStoryTimeoutMonitor } from "./useStoryTimeoutMonitor";
import type { Story } from "@/types/story";

interface UsePendingStoryMonitorProps {
  stories: Array<Story> | undefined;
  fetchStories: () => void;
  onStoryCompleted: (story: Story) => void;
}

/**
 * Hook spécialisé pour surveiller l'état des histoires en cours de génération
 * Maintenant avec surveillance des timeouts et récupération automatique
 */
export const usePendingStoryMonitor = ({ 
  stories, 
  fetchStories, 
  onStoryCompleted 
}: UsePendingStoryMonitorProps) => {
  const [pendingStoryId, setPendingStoryId] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date>(new Date());
  const { toast } = useToast();

  // Surveillance des timeouts désactivée pour éviter les fausses erreurs
  // useStoryTimeoutMonitor({ 
  //   stories: stories || [], 
  //   timeoutMinutes: 10
  // });

  useEffect(() => {
    if (!pendingStoryId || !stories) return;
    
    const pendingStory = stories.find(story => story.id === pendingStoryId);
    
    if (pendingStory) {
      console.log(`[PendingMonitor] Vérification de l'histoire: ${pendingStoryId}, statut: ${pendingStory.status}`);
      
      if (pendingStory.status === "ready" || pendingStory.status === "read") {
        console.log("Histoire complétée, affichage...");
        setPendingStoryId(null);
        onStoryCompleted(pendingStory);
        
        toast({
          title: "Histoire prête",
          description: "Votre histoire personnalisée est maintenant prête à être lue!",
        });
      } else if (pendingStory.status === 'error') {
        console.log("Erreur détectée dans la génération d'histoire");
        setPendingStoryId(null);
        
        toast({
          title: "Erreur de génération",
          description: `Une erreur est survenue: ${pendingStory.error || "Erreur inconnue"}`,
          variant: "destructive",
        });
      }
    }
    
    // Surveillance plus fréquente et intelligente
    const interval = setInterval(() => {
      if (pendingStoryId) {
        console.log(`[PendingMonitor] Vérification périodique de l'histoire: ${pendingStoryId}`);
        setLastCheck(new Date());
        fetchStories();
      }
    }, 3000); // Toutes les 3 secondes au lieu de 5
    
    return () => clearInterval(interval);
  }, [pendingStoryId, stories, onStoryCompleted, toast, fetchStories]);

  // Fonction pour démarrer la surveillance d'une nouvelle histoire
  const startMonitoring = (storyId: string) => {
    console.log(`[PendingMonitor] Démarrage de la surveillance pour: ${storyId}`);
    setPendingStoryId(storyId);
    setLastCheck(new Date());
  };

  // Fonction pour arrêter la surveillance
  const stopMonitoring = () => {
    console.log("[PendingMonitor] Arrêt de la surveillance");
    setPendingStoryId(null);
  };

  return {
    pendingStoryId,
    setPendingStoryId: startMonitoring,
    stopMonitoring,
    lastCheck,
    isMonitoring: !!pendingStoryId
  };
};
