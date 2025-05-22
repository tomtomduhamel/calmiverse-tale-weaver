
/**
 * Hook pour associer des sons aux objectifs d'histoire
 */
import { useCallback } from "react";
import { supabase } from '@/integrations/supabase/client';

export const useSoundSelectionForObjective = (toast: any) => {
  /**
   * Trouve un son approprié pour un objectif d'histoire donné
   * @param objective Objectif de l'histoire ('sleep', 'focus', 'relax', 'fun')
   * @returns ID du son sélectionné ou null
   */
  const findSoundForObjective = useCallback(async (objective: string) => {
    try {
      if (!objective) {
        console.error("❌ Objectif manquant pour la sélection du son");
        return null;
      }
      
      console.log(`🔍 Recherche d'un fond sonore pour l'objectif: ${objective}`);
      
      // Récupérer les sons correspondant à l'objectif
      const { data: sounds, error } = await supabase
        .from('sound_backgrounds')
        .select('id, title, file_path, objective')
        .eq('objective', objective);
        
      if (error) {
        console.error(`❌ Erreur lors de la recherche de sons pour l'objectif ${objective}:`, error);
        toast({
          title: "Erreur",
          description: `Impossible de trouver un fond sonore: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }
      
      if (!sounds || sounds.length === 0) {
        console.warn(`⚠️ Aucun son trouvé pour l'objectif: ${objective}`);
        return null;
      }
      
      // Vérifier que les sons ont des fichiers valides
      const validSounds = sounds.filter(sound => sound.file_path);
      
      if (validSounds.length === 0) {
        console.warn(`⚠️ Aucun son avec fichier valide pour l'objectif: ${objective}`);
        return null;
      }
      
      // Sélectionner un son aléatoirement
      const randomIndex = Math.floor(Math.random() * validSounds.length);
      const selectedSound = validSounds[randomIndex];
      
      console.log(`✅ Son sélectionné pour l'objectif ${objective}:`, {
        id: selectedSound.id,
        title: selectedSound.title,
        objective: selectedSound.objective
      });
      
      return selectedSound.id;
    } catch (error: any) {
      console.error("❌ Erreur lors de la sélection du son:", error);
      toast({
        title: "Erreur",
        description: `Problème lors de la sélection du son: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  return { findSoundForObjective };
};

export default useSoundSelectionForObjective;
