
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useObjectiveSoundAssociation } from "./useObjectiveSoundAssociation";

export const useSoundAssociation = () => {
  const { toast } = useToast();
  const { findSoundForObjective } = useObjectiveSoundAssociation();

  const associateSoundToStory = useCallback(async (storyId: string, soundId: string | null) => {
    try {
      const { error } = await supabase
        .from('stories')
        .update({ sound_id: soundId })
        .eq('id', storyId);

      if (error) throw error;

      toast({
        title: soundId ? "Fond sonore associé" : "Fond sonore retiré",
        description: soundId 
          ? "Le fond sonore a été associé à l'histoire" 
          : "Le fond sonore a été retiré de l'histoire",
      });

      return true;
    } catch (error: any) {
      console.error("Erreur lors de l'association du fond sonore:", error);
      toast({
        title: "Erreur",
        description: `Impossible d'associer le fond sonore: ${error.message}`,
        variant: "destructive",
      });
      return false;
    }
  }, [toast]);

  const getSoundDetails = useCallback(async (soundId: string) => {
    try {
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('*')
        .eq('id', soundId)
        .single();

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error("Erreur lors de la récupération des détails du son:", error);
      return null;
    }
  }, []);

  const getAllSounds = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('sound_backgrounds')
        .select('*')
        .order('title');

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error("Erreur lors de la récupération des sons:", error);
      return [];
    }
  }, []);
  
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
      console.error("Erreur lors de la récupération des sons pour l'objectif:", error);
      return [];
    }
  }, []);
  
  const associateSoundToStoryByObjective = useCallback(async (storyId: string, objective: string) => {
    try {
      // Trouver un son approprié pour cet objectif
      const soundId = await findSoundForObjective(objective);
      
      if (!soundId) {
        console.log(`Aucun son disponible pour l'objectif ${objective}`);
        return false;
      }
      
      // Associer le son à l'histoire
      return await associateSoundToStory(storyId, soundId);
    } catch (error: any) {
      console.error("Erreur lors de l'association du son par objectif:", error);
      return false;
    }
  }, [associateSoundToStory, findSoundForObjective]);

  return {
    associateSoundToStory,
    getSoundDetails,
    getAllSounds,
    getSoundsByObjective,
    associateSoundToStoryByObjective
  };
};
