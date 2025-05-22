
/**
 * Hook pour obtenir des statistiques sur les sons associés aux objectifs
 */
import { useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';

export const useSoundObjectiveStats = () => {
  /**
   * Récupère les sons disponibles pour chaque objectif
   * @returns Objet avec les sons pour chaque objectif
   */
  const getSoundsByObjective = useCallback(async () => {
    try {
      console.log("🔄 Récupération des statistiques de sons par objectif");
      
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('id, title, file_path, objective')
        .order('created_at', { ascending: false });
        
      if (error) {
        console.error("❌ Erreur lors de la récupération des sons:", error);
        throw error;
      }
      
      // Organiser les sons par objectif
      const soundsByObjective: Record<string, any[]> = {};
      
      data?.forEach(sound => {
        if (sound.objective) {
          if (!soundsByObjective[sound.objective]) {
            soundsByObjective[sound.objective] = [];
          }
          soundsByObjective[sound.objective].push(sound);
        }
      });
      
      console.log("✅ Sons récupérés par objectif:", Object.keys(soundsByObjective).map(key => 
        `${key}: ${soundsByObjective[key].length} sons`
      ));
      
      return soundsByObjective;
    } catch (error: any) {
      console.error("❌ Erreur lors de la récupération des sons par objectif:", error);
      return {};
    }
  }, []);

  /**
   * Récupère des statistiques globales sur les sons par objectif
   * @returns Objet avec des statistiques pour chaque objectif
   */
  const getSoundObjectiveStats = useCallback(async () => {
    try {
      console.log("🔄 Récupération des statistiques globales de sons");
      
      const soundsByObjective = await getSoundsByObjective();
      
      const stats = Object.keys(soundsByObjective).map(objective => ({
        objective,
        count: soundsByObjective[objective].length,
        validSoundsCount: soundsByObjective[objective].filter(s => s.file_path).length
      }));
      
      console.log("✅ Statistiques globales des sons:", stats);
      
      return stats;
    } catch (error: any) {
      console.error("❌ Erreur lors du calcul des statistiques:", error);
      return [];
    }
  }, [getSoundsByObjective]);

  return { getSoundsByObjective, getSoundObjectiveStats };
};

export default useSoundObjectiveStats;
