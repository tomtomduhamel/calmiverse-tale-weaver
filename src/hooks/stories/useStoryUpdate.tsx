
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/hooks/use-toast";

export const useStoryUpdate = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const updateStoryStatus = useCallback(async (storyId: string, status: 'pending' | 'completed' | 'read' | 'error', errorDetails?: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Mise à jour du statut de l'histoire: ${storyId} -> ${status}`);
      
      const updateData: any = {
        status,
        updatedat: new Date().toISOString()
      };
      
      // Ajouter les détails d'erreur si fournis
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
      
      console.log('✅ Statut de l\'histoire mis à jour avec succès:', {
        id: storyId,
        newStatus: status
      });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut de l\'histoire:', error);
      throw error;
    }
  }, [user]);

  return {
    updateStoryStatus,
  };
};
