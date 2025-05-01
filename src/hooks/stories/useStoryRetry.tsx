
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/hooks/use-toast";
import { useStoryUpdate } from './useStoryUpdate';

export const useStoryRetry = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { updateStoryStatus } = useStoryUpdate();

  const retryStoryGeneration = useCallback(async (storyId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Nouvelle tentative de génération pour l'histoire: ${storyId}`);
      
      // Mettre à jour le statut de l'histoire à "pending"
      await updateStoryStatus(storyId, 'pending');
      
      // Obtenir les informations de l'histoire
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('authorid', user.id)
        .single();
      
      if (storyError) throw storyError;
      
      // Appeler la fonction edge pour régénérer l'histoire
      const { data: generationData, error: generationError } = await supabase.functions.invoke('retry-story', {
        body: {
          storyId: storyId,
          objective: storyData.objective,
          childrenNames: storyData.childrennames
        }
      });
      
      if (generationError) {
        console.error('Erreur lors de la nouvelle tentative de génération:', generationError);
        
        // Mettre à jour l'histoire avec une erreur
        await updateStoryStatus(storyId, 'error', generationError.message);
        
        toast({
          title: "Erreur",
          description: "La nouvelle tentative a échoué: " + generationError.message,
          variant: "destructive",
        });
        
        throw generationError;
      }
      
      // Mettre à jour l'histoire avec le contenu régénéré
      await supabase
        .from('stories')
        .update({
          title: generationData.title || storyData.title,
          content: generationData.story_text || '',
          summary: generationData.story_summary || '',
          preview: generationData.preview || '',
          status: 'completed',
          updatedat: new Date().toISOString()
        })
        .eq('id', storyId);
      
      toast({
        title: "Nouvelle tentative",
        description: "La régénération de l'histoire a réussi",
      });
      
      return generationData;
    } catch (error) {
      console.error('Erreur lors de la nouvelle tentative de génération:', error);
      const errorMessage = error instanceof Error ? error.message : 'Échec de la nouvelle tentative de génération';
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [user, toast, updateStoryStatus]);

  return { retryStoryGeneration };
};
