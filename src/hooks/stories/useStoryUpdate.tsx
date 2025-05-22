
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook pour gérer les mises à jour des histoires
 */
export const useStoryUpdate = () => {
  const { user } = useSupabaseAuth();

  /**
   * Mettre à jour le statut d'une histoire
   */
  const updateStoryStatus = useCallback(async (
    storyId: string, 
    status: 'pending' | 'completed' | 'read' | 'error', 
    errorDetails?: string
  ) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Updating story status: ${storyId} -> ${status}`);
      
      const updateData: any = {
        status,
        updatedat: new Date().toISOString()
      };
      
      // Add error details if provided
      if (status === 'error' && errorDetails) {
        updateData.error = errorDetails;
      }
      
      const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .eq('authorid', user.id);
        
      if (error) throw error;
      
      console.log('✅ Story status updated successfully');
    } catch (error: any) {
      console.error('❌ Error updating story status:', error);
      throw error;
    }
  }, [user]);

  return {
    updateStoryStatus
  };
};
