
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook pour gérer les appels aux fonctions cloud pour les histoires
 */
export const useStoryCloudFunctions = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  /**
   * Relancer la génération d'une histoire qui a échoué
   */
  const retryStoryGeneration = useCallback(async (storyId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Retrying story generation for: ${storyId}`);
      
      // Mettre à jour le statut à "pending"
      const { error: updateError } = await supabase
        .from('stories')
        .update({
          status: 'pending',
          updatedat: new Date().toISOString(),
          error: null // Supprimer l'erreur précédente
        })
        .eq('id', storyId)
        .eq('authorid', user.id);
        
      if (updateError) throw updateError;
      
      // Appeler la fonction edge corrigée avec le bon nom
      const { data, error } = await supabase.functions.invoke('retry-story', {
        body: { storyId }
      });
      
      if (error) {
        console.error('Error calling retry-story function:', error);
        // Mettre à jour le statut à "error"
        await supabase
          .from('stories')
          .update({
            status: 'error',
            updatedat: new Date().toISOString(),
            error: error.message || 'Erreur lors de la relance'
          })
          .eq('id', storyId)
          .eq('authorid', user.id);
        
        throw error;
      }
      
      console.log('Retry function called successfully:', data);
      
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
  }, [user, toast]);

  return {
    retryStoryGeneration
  };
};
