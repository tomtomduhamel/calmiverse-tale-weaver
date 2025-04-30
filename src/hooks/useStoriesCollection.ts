
/**
 * @deprecated Ce hook est maintenu uniquement pour la compatibilité.
 * Utiliser useSupabaseStories à la place.
 */

import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/hooks/use-toast";

export const useStoriesCollection = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const saveStory = async (content: string, childrenIds: string[], objective: string) => {
    try {
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }
      
      const storyData = {
        content,
        childrenids: childrenIds,
        objective,
        authorid: user.id,
        createdat: new Date().toISOString(),
        updatedat: new Date().toISOString(),
        status: 'completed'
      };

      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Succès",
        description: "L'histoire a été sauvegardée avec succès",
      });

      return data.id;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'histoire:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    saveStory,
  };
};
