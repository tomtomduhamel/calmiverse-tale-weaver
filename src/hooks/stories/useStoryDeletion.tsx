
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook pour gérer la suppression des histoires
 */
export const useStoryDeletion = () => {
  const { user } = useSupabaseAuth();

  /**
   * Supprimer une histoire
   */
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
    } catch (error: any) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }, [user]);

  return {
    deleteStory
  };
};
