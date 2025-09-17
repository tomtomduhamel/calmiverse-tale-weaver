import React, { createContext, useContext, useEffect } from 'react';
import { useBackgroundStoryGeneration } from '@/hooks/stories/useBackgroundStoryGeneration';
import { useStoriesInProgress } from '@/hooks/stories/useStoriesInProgress';
import { StoryGenerationQueue } from './StoryGenerationQueue';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface StoryGenerationManagerContextType {
  generateStoryInBackground: (storyData: {
    childrenIds: string[];
    objective: string;
    title?: string;
  }) => Promise<string>;
  activeGenerations: any[];
  totalActiveCount: number;
  queueSize: number;
}

const StoryGenerationManagerContext = createContext<StoryGenerationManagerContextType | null>(null);

interface StoryGenerationManagerProps {
  children: React.ReactNode;
}

/**
 * Service central de gestion des générations d'histoires
 * Coordonne la file d'attente locale et la génération en arrière-plan
 */
export const StoryGenerationManager: React.FC<StoryGenerationManagerProps> = ({ children }) => {
  const { user } = useSupabaseAuth();
  const {
    activeGenerations,
    totalActiveCount,
    startGeneration,
    completeGeneration,
    failGeneration
  } = useBackgroundStoryGeneration();

  const {
    storiesInProgress,
    addStoryToProgress,
    updateStoryProgress,
    removeStoryFromProgress
  } = useStoriesInProgress();

  const queue = StoryGenerationQueue.getInstance();

  const generateStoryInBackground = async (storyData: {
    childrenIds: string[];
    objective: string;
    title?: string;
  }): Promise<string> => {
    if (!user) {
      throw new Error('Utilisateur non authentifié');
    }

    console.log('[StoryGenerationManager] Ajout d\'une nouvelle génération:', storyData);

    // Créer un ID temporaire pour la génération
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Ajouter à la file d'attente locale
    await queue.addToQueue({
      id: tempId,
      ...storyData,
      userId: user.id,
      createdAt: new Date(),
      status: 'pending'
    });

    // Démarrer la génération en arrière-plan
    startGeneration(tempId, storyData.title || 'Histoire personnalisée');
    addStoryToProgress(tempId, {
      childrenIds: storyData.childrenIds,
      objective: storyData.objective,
      title: storyData.title,
      startTime: Date.now()
    });

    return tempId;
  };

  // Synchroniser avec la file d'attente
  useEffect(() => {
    const handleQueueUpdate = () => {
      // Mettre à jour les indicateurs si nécessaire
    };

    queue.subscribe(handleQueueUpdate);
    return () => queue.unsubscribe(handleQueueUpdate);
  }, []);

  return (
    <StoryGenerationManagerContext.Provider
      value={{
        generateStoryInBackground,
        activeGenerations,
        totalActiveCount,
        queueSize: queue.getQueueSize()
      }}
    >
      {children}
    </StoryGenerationManagerContext.Provider>
  );
};

export const useStoryGenerationManager = (): StoryGenerationManagerContextType => {
  const context = useContext(StoryGenerationManagerContext);
  if (!context) {
    throw new Error('useStoryGenerationManager must be used within a StoryGenerationManager');
  }
  return context;
};