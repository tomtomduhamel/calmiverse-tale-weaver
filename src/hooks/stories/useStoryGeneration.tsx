
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from "@/hooks/use-toast";

export const useStoryGeneration = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const generateStory = useCallback(async (objective: string, childrenNames: string[]) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('Appel à la fonction Edge pour générer une histoire', {
        objective,
        childrenNames
      });
      
      const { data, error } = await supabase.functions.invoke('generate-story', {
        body: {
          objective,
          childrenNames
        }
      });
      
      if (error) {
        console.error('Erreur lors de la génération d\'histoire:', error);
        toast({
          title: 'Erreur',
          description: error.message || 'La génération de l\'histoire a échoué',
          variant: 'destructive',
        });
        throw error;
      }
      
      console.log('Histoire générée avec succès:', data);
      return data;
    } catch (error: any) {
      console.error('Erreur lors de la génération d\'histoire:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'La génération de l\'histoire a échoué',
        variant: 'destructive',
      });
      throw error;
    }
  }, [user, toast]);

  return { generateStory };
};
