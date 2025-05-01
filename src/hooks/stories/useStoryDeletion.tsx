
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useStoryDeletion = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Deleting story: ${storyId}`);
      
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('authorid', user.id);
      
      if (error) throw error;
      
      console.log('Story deleted successfully');
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  return {
    deleteStory
  };
};
