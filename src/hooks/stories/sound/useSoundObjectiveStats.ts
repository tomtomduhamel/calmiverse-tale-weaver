
import { useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour gérer les statistiques et la récupération des sons par objectif
 */
export const useSoundObjectiveStats = () => {
  /**
   * Obtient tous les sons disponibles pour un objectif spécifique
   * @param objective Objectif ('sleep', 'focus', 'relax', 'fun')
   * @returns Tableau des sons correspondant à l'objectif
   */
  const getSoundsByObjective = useCallback(async (objective: string) => {
    try {
      console.log(`🔍 Recherche des sons pour l'objectif: ${objective}`);
      
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('*')
        .eq('objective', objective)
        .order('title');
      
      if (error) {
        console.error(`❌ Erreur lors de la récupération des sons pour l'objectif ${objective}:`, error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`⚠️ Aucun son trouvé pour l'objectif: ${objective}`);
        return [];
      }
      
      // Filtrer pour ne garder que les sons avec un fichier valide
      const validSounds = data.filter(sound => sound.file_path);
      
      console.log(`✅ ${validSounds.length} sons valides trouvés pour l'objectif: ${objective}`);
      return validSounds;
    } catch (error: any) {
      console.error(`❌ Erreur lors de la récupération des sons pour l'objectif ${objective}:`, error);
      return [];
    }
  }, []);
  
  /**
   * Obtient les statistiques sur le nombre de sons par objectif
   * @returns Objet avec les comptages par objectif
   */
  const getSoundObjectiveStats = useCallback(async () => {
    try {
      console.log("🔍 Récupération des statistiques de sons par objectif");
      
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('objective, file_path');
      
      if (error) {
        console.error("❌ Erreur lors de la récupération des statistiques:", error);
        throw error;
      }
      
      const stats = {
        sleep: 0,
        focus: 0,
        relax: 0,
        fun: 0
      };
      
      if (data) {
        // Ne compter que les sons avec un fichier valide
        data
          .filter(item => item.file_path)
          .forEach(item => {
            if (item.objective in stats) {
              stats[item.objective as keyof typeof stats]++;
            }
          });
      }
      
      console.log("✅ Statistiques de sons par objectif:", stats);
      return stats;
    } catch (error: any) {
      console.error("❌ Erreur lors de la récupération des statistiques de sons:", error);
      return { sleep: 0, focus: 0, relax: 0, fun: 0 };
    }
  }, []);

  return { getSoundsByObjective, getSoundObjectiveStats };
};
