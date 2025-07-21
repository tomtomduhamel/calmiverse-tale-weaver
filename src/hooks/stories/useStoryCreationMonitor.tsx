
import { useState, useEffect, useCallback } from 'react';
import { useSupabaseStories } from './useSupabaseStories';
import { useToast } from '@/hooks/use-toast';

interface StoryCreationMonitorOptions {
  onStoryCreated?: (storyId: string) => void;
  onTimeout?: () => void;
  timeoutMs?: number;
}

export const useStoryCreationMonitor = (options: StoryCreationMonitorOptions = {}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringStartTime, setMonitoringStartTime] = useState<number | null>(null);
  const { stories, fetchStories } = useSupabaseStories();
  const { toast } = useToast();
  
  const {
    onStoryCreated,
    onTimeout,
    timeoutMs = 60000 // 60 secondes par défaut
  } = options;

  const startMonitoring = useCallback((initialStoryCount: number) => {
    console.log('[StoryCreationMonitor] Démarrage de la surveillance:', { initialStoryCount });
    setIsMonitoring(true);
    setMonitoringStartTime(Date.now());
    
    // Commencer le polling immédiatement
    const pollInterval = setInterval(async () => {
      try {
        console.log('[StoryCreationMonitor] Vérification des nouvelles histoires...');
        await fetchStories();
        
        // Vérifier si une nouvelle histoire est apparue
        if (stories.length > initialStoryCount) {
          const newStory = stories[0]; // La plus récente
          console.log('[StoryCreationMonitor] SUCCÈS: Nouvelle histoire détectée:', newStory.id);
          
          clearInterval(pollInterval);
          setIsMonitoring(false);
          setMonitoringStartTime(null);
          
          toast({
            title: "Histoire créée avec succès",
            description: "Votre histoire est maintenant disponible dans votre bibliothèque",
          });
          
          if (onStoryCreated) {
            onStoryCreated(newStory.id);
          }
          return;
        }
        
        // Vérifier le timeout
        if (monitoringStartTime && Date.now() - monitoringStartTime > timeoutMs) {
          console.warn('[StoryCreationMonitor] TIMEOUT: Temps limite dépassé');
          clearInterval(pollInterval);
          setIsMonitoring(false);
          setMonitoringStartTime(null);
          
          toast({
            title: "Création en cours",
            description: "La création prend plus de temps que prévu. Vérifiez votre bibliothèque dans quelques minutes.",
            variant: "default",
          });
          
          if (onTimeout) {
            onTimeout();
          }
        }
      } catch (error) {
        console.error('[StoryCreationMonitor] Erreur lors du polling:', error);
      }
    }, 3000); // Vérifier toutes les 3 secondes

    return () => {
      clearInterval(pollInterval);
      setIsMonitoring(false);
      setMonitoringStartTime(null);
    };
  }, [stories, fetchStories, monitoringStartTime, timeoutMs, onStoryCreated, onTimeout, toast]);

  const stopMonitoring = useCallback(() => {
    console.log('[StoryCreationMonitor] Arrêt manuel de la surveillance');
    setIsMonitoring(false);
    setMonitoringStartTime(null);
  }, []);

  return {
    isMonitoring,
    startMonitoring,
    stopMonitoring
  };
};
