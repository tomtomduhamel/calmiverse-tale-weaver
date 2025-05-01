
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useStoryUpdate } from './useStoryUpdate';

export const useStoryRetry = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  const { updateStoryStatus } = useStoryUpdate();

  const retryStoryGeneration = useCallback(async (storyId: string) => {
    if (!user) {
      console.error("Erreur: utilisateur non connecté lors de la relance");
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Relance de la génération pour l'histoire: ${storyId}`);
      
      // Mise à jour du statut à "pending"
      await updateStoryStatus(storyId, 'pending');
      
      // Appel à la fonction Edge pour réessayer
      const { data, error } = await supabase.functions.invoke('retry-story', {
        body: { storyId }
      });
      
      if (error) {
        console.error("Erreur lors de l'appel à la fonction retry-story:", error);
        
        // Mise à jour du statut à "error"
        await updateStoryStatus(storyId, 'error', error.message || "Échec de la relance");
        throw error;
      }
      
      console.log("Relance initiée avec succès:", data);
      
      toast({
        title: "Nouvelle tentative",
        description: "La génération de l'histoire a été relancée",
      });
      
      return data;
    } catch (error: any) {
      console.error('Erreur lors de la relance de génération:', error);
      
      // S'assurer que le statut est mis à jour en cas d'erreur
      try {
        await updateStoryStatus(storyId, 'error', error.message || "La relance a échoué");
      } catch (updateError) {
        console.error("Impossible de mettre à jour le statut après l'échec:", updateError);
      }
      
      toast({
        title: "Erreur",
        description: "La nouvelle tentative a échoué: " + (error.message || "Erreur inconnue"),
        variant: "destructive",
      });
      
      throw error;
    }
  }, [user, updateStoryStatus, toast]);

  return {
    retryStoryGeneration
  };
};
