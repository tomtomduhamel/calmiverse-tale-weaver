
import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useStoryMutations } from './useStoryMutations';
import type { Story } from '@/types/story';

export const useStoryCleaner = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { deleteStory } = useStoryMutations();
  const { toast } = useToast();

  const cleanReadStories = async (stories: Story[]) => {
    setIsLoading(true);
    try {
      const readStories = stories.filter(story => story.status === 'read');
      
      if (readStories.length === 0) {
        toast({
          title: "Information",
          description: "Aucune histoire lue à nettoyer",
        });
        return;
      }

      console.log('🧹 Début du nettoyage des histoires lues:', {
        totalStories: readStories.length,
        timestamp: new Date().toISOString()
      });

      const BATCH_SIZE = 10;
      const batches = Math.ceil(readStories.length / BATCH_SIZE);

      for (let i = 0; i < batches; i++) {
        const start = i * BATCH_SIZE;
        const end = Math.min(start + BATCH_SIZE, readStories.length);
        const batch = readStories.slice(start, end);

        console.log(`📦 Traitement du lot ${i + 1}/${batches}:`, {
          batchSize: batch.length,
          startIndex: start,
          endIndex: end
        });

        await Promise.all(batch.map(story => deleteStory(story.id)));
      }

      console.log('✅ Nettoyage terminé:', {
        storiesDeleted: readStories.length,
        timestamp: new Date().toISOString()
      });

      toast({
        title: "Succès",
        description: `${readStories.length} histoire${readStories.length > 1 ? 's' : ''} supprimée${readStories.length > 1 ? 's' : ''}`,
      });
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage:', error);
      toast({
        title: "Erreur",
        description: "Impossible de nettoyer les histoires",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    cleanReadStories,
    isLoading
  };
};
