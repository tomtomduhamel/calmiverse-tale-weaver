
import { useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook pour gérer l'association entre les objectifs d'histoire et les fonds sonores
 */
export const useObjectiveSoundAssociation = () => {
  const { toast } = useToast();

  /**
   * Trouve un son approprié pour un objectif d'histoire avec vérification du fichier
   * @param objective Objectif de l'histoire ('sleep', 'focus', 'relax', 'fun')
   * @returns ID du son ou null si aucun trouvé
   */
  const findSoundForObjective = useCallback(async (objective: string) => {
    if (!objective) {
      console.log("⚠️ Objectif non fourni pour la recherche de son");
      return null;
    }
    
    try {
      console.log(`🔍 Recherche de sons pour l'objectif: ${objective}`);
      
      // Rechercher les sons correspondant à l'objectif
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('id, title, file_path')
        .eq('objective', objective)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("❌ Erreur lors de la recherche de sons:", error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log(`⚠️ Aucun son trouvé pour l'objectif: ${objective}`);
        return null;
      }

      // Filtrer pour ne garder que les sons avec un fichier valide
      const validSounds = data.filter(sound => sound.file_path);
      
      if (validSounds.length === 0) {
        console.log(`⚠️ Aucun son avec fichier valide trouvé pour l'objectif: ${objective}`);
        return null;
      }
      
      // Sélectionner un son aléatoirement parmi ceux qui correspondent
      const randomIndex = Math.floor(Math.random() * validSounds.length);
      const selectedSound = validSounds[randomIndex];
      
      console.log(`✅ Son sélectionné pour l'objectif ${objective}:`, {
        id: selectedSound.id,
        title: selectedSound.title,
        filePath: selectedSound.file_path
      });
      
      return selectedSound.id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la recherche d'un son pour l'objectif:", error);
      toast({
        title: "Erreur",
        description: `Impossible de trouver un son approprié: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);
  
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

  return {
    findSoundForObjective,
    autoAssociateSoundToStory,
    getSoundsByObjective,
    getSoundObjectiveStats
  };
};
