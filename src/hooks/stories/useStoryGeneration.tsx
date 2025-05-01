
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
      
      // Créer d'abord un enregistrement temporaire pour l'histoire
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .insert({
          title: `Histoire pour ${childrenNames.join(' et ')}`,
          content: '',
          summary: 'Génération en cours...',
          preview: 'Histoire en cours de création...',
          status: 'pending',
          childrenids: childrenNames.map(_ => ''), // Sera mis à jour ultérieurement
          childrennames: childrenNames,
          objective: objective,
          authorid: user.id,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();
        
      if (storyError) throw storyError;
      
      // Appeler la fonction Edge pour générer l'histoire complète
      const { data, error } = await supabase.functions.invoke('generateStory', {
        body: {
          storyId: storyData.id,
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
      return {
        storyId: storyData.id,
        storyData: data?.storyData || {}
      };
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
