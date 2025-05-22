
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook pour gérer l'association entre les objectifs d'histoire et les fonds sonores
 */
export const useObjectiveSoundAssociation = () => {
  const { toast } = useToast();

  /**
   * Trouve un son approprié pour un objectif d'histoire
   * @param objective Objectif de l'histoire ('sleep', 'focus', 'relax', 'fun')
   * @returns ID du son ou null si aucun trouvé
   */
  const findSoundForObjective = useCallback(async (objective: string) => {
    if (!objective) return null;
    
    try {
      // Rechercher les sons correspondant à l'objectif
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('id, title')
        .eq('objective', objective)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Sélectionner un son aléatoirement parmi ceux qui correspondent
        const randomIndex = Math.floor(Math.random() * data.length);
        console.log(`Son sélectionné pour l'objectif ${objective}:`, data[randomIndex].title);
        return data[randomIndex].id;
      }
      
      return null;
    } catch (error: any) {
      console.error("Erreur lors de la recherche d'un son pour l'objectif:", error);
      return null;
    }
  }, []);
  
  /**
   * Associe automatiquement un son approprié à une histoire selon son objectif
   * @param storyId ID de l'histoire
   * @param objective Objectif de l'histoire ('sleep', 'focus', 'relax', 'fun')
   * @returns Boolean indiquant le succès de l'opération
   */
  const autoAssociateSoundToStory = useCallback(async (storyId: string, objective: string) => {
    try {
      if (!storyId || !objective) {
        console.error("ID d'histoire ou objectif manquant");
        return false;
      }
      
      // Trouver un son approprié pour cet objectif
      const soundId = await findSoundForObjective(objective);
      
      if (!soundId) {
        console.log(`Aucun son disponible pour l'objectif ${objective}`);
        return false;
      }
      
      // Associer le son à l'histoire
      const { error } = await supabase
        .from('stories')
        .update({ sound_id: soundId })
        .eq('id', storyId);
      
      if (error) throw error;
      
      console.log(`Son automatiquement associé à l'histoire ${storyId} pour l'objectif ${objective}`);
      return true;
    } catch (error: any) {
      console.error("Erreur lors de l'association automatique du son:", error);
      toast({
        title: "Erreur",
        description: `Impossible d'associer automatiquement un fond sonore: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  }, [findSoundForObjective, toast]);
  
  /**
   * Obtient tous les sons disponibles pour un objectif spécifique
   * @param objective Objectif ('sleep', 'focus', 'relax', 'fun')
   * @returns Tableau des sons correspondant à l'objectif
   */
  const getSoundsByObjective = useCallback(async (objective: string) => {
    try {
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('*')
        .eq('objective', objective)
        .order('title');
      
      if (error) throw error;
      
      return data || [];
    } catch (error: any) {
      console.error(`Erreur lors de la récupération des sons pour l'objectif ${objective}:`, error);
      return [];
    }
  }, []);
  
  /**
   * Obtient les statistiques sur le nombre de sons par objectif
   * @returns Objet avec les comptages par objectif
   */
  const getSoundObjectiveStats = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('objective');
      
      if (error) throw error;
      
      const stats = {
        sleep: 0,
        focus: 0,
        relax: 0,
        fun: 0
      };
      
      if (data) {
        data.forEach(item => {
          if (item.objective in stats) {
            stats[item.objective as keyof typeof stats]++;
          }
        });
      }
      
      return stats;
    } catch (error: any) {
      console.error("Erreur lors de la récupération des statistiques de sons:", error);
      return { sleep: 0, focus: 0, relax: 0, fun: 0 };
    }
  }, []);

  return {
    findSoundForObjective,
    autoAssociateSoundToStory,
    getSoundsByObjective,
    getSoundObjectiveStats
  };
};
