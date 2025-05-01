
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useStoryDeletion = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) {
      console.error("Tentative de suppression sans authentification");
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Suppression de l'histoire: ${storyId} par utilisateur: ${user.id}`);
      
      // Vérifier que l'histoire existe et appartient à l'utilisateur
      const { data: existingStory, error: checkError } = await supabase
        .from('stories')
        .select('id, title')
        .eq('id', storyId)
        .eq('authorid', user.id)
        .single();
      
      if (checkError || !existingStory) {
        console.error("Histoire introuvable ou non autorisée:", checkError);
        throw new Error("Histoire introuvable ou vous n'avez pas l'autorisation de la supprimer");
      }
      
      console.log(`Suppression confirmée pour l'histoire: ${existingStory.title}`);
      
      // Procéder à la suppression
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('authorid', user.id);
      
      if (error) {
        console.error("Erreur Supabase lors de la suppression:", error);
        throw error;
      }
      
      console.log('Histoire supprimée avec succès');
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
      
      return { success: true, deletedId: storyId };
    } catch (error: any) {
      console.error('Erreur lors de la suppression de l\'histoire:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  return {
    deleteStory
  };
};
