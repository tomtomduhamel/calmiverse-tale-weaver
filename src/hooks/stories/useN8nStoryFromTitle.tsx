
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface StoryCreationData {
  selectedTitle: string;
  objective: string;
  childrenIds: string[];
  childrenNames: string[];
}

export const useN8nStoryFromTitle = () => {
  const [isCreatingStory, setIsCreatingStory] = useState(false);
  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  const createStoryFromTitle = async (data: StoryCreationData): Promise<string> => {
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    setIsCreatingStory(true);
    
    try {
      console.log('[N8nStoryFromTitle] Création d\'histoire à partir du titre:', data);
      
      const webhookUrl = 'https://n8n.srv856374.hstgr.cloud/webhook-test/067eebcf-cb13-4e1b-8b6b-b21e872c1d60';
      
      const payload = {
        action: 'create_story_from_title',
        selectedTitle: data.selectedTitle,
        objective: data.objective,
        childrenIds: data.childrenIds,
        childrenNames: data.childrenNames,
        userId: user.id,
        requestType: 'story_creation'
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      console.log('[N8nStoryFromTitle] Réponse reçue:', result);

      // Extraire l'ID de l'histoire créée
      const storyId = result.storyId || result.id || `story-${Date.now()}`;

      toast({
        title: "Histoire en cours de création",
        description: "Votre histoire personnalisée est en cours de génération",
      });

      return storyId;
    } catch (error: any) {
      console.error('[N8nStoryFromTitle] Erreur:', error);
      
      toast({
        title: "Erreur de création",
        description: error.message || "Impossible de créer l'histoire",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsCreatingStory(false);
    }
  };

  return {
    createStoryFromTitle,
    isCreatingStory
  };
};
