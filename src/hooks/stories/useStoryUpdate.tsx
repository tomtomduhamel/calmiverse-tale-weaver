
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';
import { useToast } from "@/hooks/use-toast";

export const useStoryUpdate = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { callCloudFunctionWithRetry } = useStoryCloudFunctions();

  const updateStoryStatus = async (storyId: string, status: 'pending' | 'completed' | 'read' | 'error', errorDetails?: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Updating story status: ${storyId} -> ${status}`);
      
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
      
      console.log('✅ Story status updated successfully:', {
        id: storyId,
        newStatus: status
      });
    } catch (error) {
      console.error('❌ Error updating story status:', error);
      throw error;
    }
  };

  const retryStoryGeneration = async (storyId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Retrying story generation for: ${storyId}`);
      // Mettre à jour le statut de l'histoire à "pending"
      await updateStoryStatus(storyId, 'pending');
      
      // Appeler la fonction Edge de Supabase pour réessayer
      const { data, error } = await supabase.functions.invoke('retry-story', {
        body: { storyId }
      });
      
      if (error) throw error;
      
      console.log('Story retry request successful:', data);
      toast({
        title: "Nouvelle tentative",
        description: "La génération de l'histoire a été relancée",
      });
      
      return data;
    } catch (error) {
      console.error('Error retrying story generation:', error);
      
      // Remettre le statut de l'histoire à "error"
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry story generation';
      await updateStoryStatus(storyId, 'error', errorMessage);
      
      toast({
        title: "Erreur",
        description: "La nouvelle tentative a échoué: " + errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return {
    updateStoryStatus,
    retryStoryGeneration
  };
};
