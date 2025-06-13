
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook pour gérer la suppression des histoires avec logs de débogage améliorés
 */
export const useStoryDeletion = () => {
  const { user } = useSupabaseAuth();

  /**
   * Supprimer une histoire avec vérification complète
   */
  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) {
      console.error("[useStoryDeletion] ERROR: Utilisateur non connecté");
      throw new Error("Utilisateur non connecté");
    }

    if (!storyId || typeof storyId !== 'string') {
      console.error("[useStoryDeletion] ERROR: ID d'histoire invalide:", storyId);
      throw new Error("ID d'histoire invalide");
    }

    try {
      console.log(`[useStoryDeletion] DEBUG: Début suppression histoire ${storyId} pour utilisateur ${user.id}`);
      
      // Vérifier d'abord que l'histoire existe et appartient à l'utilisateur
      const { data: existingStory, error: fetchError } = await supabase
        .from('stories')
        .select('id, title, authorid')
        .eq('id', storyId)
        .eq('authorid', user.id)
        .single();

      if (fetchError) {
        console.error("[useStoryDeletion] ERROR: Erreur lors de la vérification de l'histoire:", fetchError);
        throw new Error(`Impossible de vérifier l'histoire: ${fetchError.message}`);
      }

      if (!existingStory) {
        console.error("[useStoryDeletion] ERROR: Histoire non trouvée ou non autorisée");
        throw new Error("Histoire non trouvée ou vous n'avez pas l'autorisation de la supprimer");
      }

      console.log(`[useStoryDeletion] DEBUG: Histoire trouvée:`, {
        id: existingStory.id,
        title: existingStory.title,
        authorid: existingStory.authorid
      });
      
      // Procéder à la suppression
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('authorid', user.id);
        
      if (deleteError) {
        console.error("[useStoryDeletion] ERROR: Erreur lors de la suppression:", deleteError);
        throw new Error(`Échec de la suppression: ${deleteError.message}`);
      }
      
      // Vérifier que la suppression a bien eu lieu
      const { data: deletedCheck, error: checkError } = await supabase
        .from('stories')
        .select('id')
        .eq('id', storyId);

      if (checkError) {
        console.warn("[useStoryDeletion] WARN: Impossible de vérifier la suppression:", checkError);
      } else if (deletedCheck && deletedCheck.length > 0) {
        console.error("[useStoryDeletion] ERROR: L'histoire existe toujours après suppression");
        throw new Error("La suppression semble avoir échoué");
      }

      console.log(`[useStoryDeletion] SUCCESS: Histoire ${storyId} supprimée avec succès`);
      return true;
    } catch (error: any) {
      console.error(`[useStoryDeletion] ERROR: Erreur complète lors de la suppression de ${storyId}:`, error);
      throw error;
    }
  }, [user]);

  return {
    deleteStory
  };
};
