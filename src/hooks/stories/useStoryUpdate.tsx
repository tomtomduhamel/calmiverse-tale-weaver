
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/hooks/use-toast";

export const useStoryUpdate = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const updateStoryStatus = useCallback(async (storyId: string, status: 'pending' | 'ready' | 'read' | 'error', errorDetails?: string) => {
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
      } else if (status !== 'error') {
        updateData.error = null;
      }
      
      const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .eq('authorid', user.id);
      
      if (error) throw error;
      
      console.log('✅ Story status updated successfully:', {
        id: storyId,
        newStatus: status
      });
    } catch (error) {
      console.error('❌ Error updating story status:', error);
      throw error;
    }
  }, [user]);

  return {
    updateStoryStatus,
  };
};
