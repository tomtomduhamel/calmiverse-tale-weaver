
import { useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer les opérations d'association entre histoires et sons
 */
export const useSoundAssociationOperations = (
  findSoundForObjective: (objective: string) => Promise<string | null>,
  toast: any
) => {
  /**
   * Associe automatiquement un son approprié à une histoire selon son objectif
   * @param storyId ID de l'histoire
   * @param objective Objectif de l'histoire ('sleep', 'focus', 'relax', 'fun')
   * @returns Boolean indiquant le succès de l'opération
   */
  const autoAssociateSoundToStory = useCallback(async (storyId: string, objective: string) => {
    try {
      if (!storyId || !objective) {
        console.error("❌ ID d'histoire ou objectif manquant");
        return false;
      }
      
      console.log(`🔄 Association automatique d'un son pour l'histoire ${storyId} avec objectif ${objective}`);
      
      // Trouver un son approprié pour cet objectif
      const soundId = await findSoundForObjective(objective);
      
      if (!soundId) {
        console.log(`⚠️ Aucun son disponible pour l'objectif ${objective}`);
        return false;
      }
      
      // Associer le son à l'histoire
      const { error } = await supabase
        .from('stories')
        .update({ sound_id: soundId })
        .eq('id', storyId);
      
      if (error) {
        console.error("❌ Erreur lors de l'association du son:", error);
        throw error;
      }
      
      console.log(`✅ Son automatiquement associé à l'histoire ${storyId} pour l'objectif ${objective}`);
      return true;
    } catch (error: any) {
      console.error("❌ Erreur lors de l'association automatique du son:", error);
      toast({
        title: "Erreur",
        description: `Impossible d'associer automatiquement un fond sonore: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  }, [findSoundForObjective, toast]);

  return { autoAssociateSoundToStory };
};

export default useSoundAssociationOperations;
