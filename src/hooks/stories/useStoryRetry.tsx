
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
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Retrying story generation for: ${storyId}`);
      
      // Update status to "pending"
      await updateStoryStatus(storyId, 'pending');
      
      // Call edge function to retry
      const { data, error } = await supabase.functions.invoke('retry-story', {
        body: { storyId }
      });
      
      if (error) {
        console.error("Error calling retry function:", error);
        
        // Update status to "error"
        await updateStoryStatus(storyId, 'error', error.message || "Échec de la relance");
        throw error;
      }
      
      console.log("Retry initiated successfully:", data);
      
      toast({
        title: "Nouvelle tentative",
        description: "La génération de l'histoire a été relancée",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error retrying story generation:', error);
      
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
