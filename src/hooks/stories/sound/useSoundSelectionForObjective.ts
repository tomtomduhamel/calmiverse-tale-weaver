
import { useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook pour trouver un son adapté à un objectif d'histoire
 */
export const useSoundSelectionForObjective = (toast: any) => {
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

  return { findSoundForObjective };
};
