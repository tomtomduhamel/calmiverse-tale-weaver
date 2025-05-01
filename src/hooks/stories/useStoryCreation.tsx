
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { createStoryData } from './storyFormatters';

export const useStoryCreation = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('🚀 Démarrage du processus de création d\'histoire...', {
        formData,
        currentUser: user.id
      });
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('Enfants sélectionnés pour l\'histoire:', childrenNames);
      
      if (!formData.objective) {
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      // Créer l'histoire avec statut en attente
      const storyData = createStoryData(formData, childrenNames);

      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      const storyId = data.id;
      console.log('Document d\'histoire initial créé avec l\'ID:', storyId);
      
      // Appeler la fonction edge pour générer l'histoire
      const { data: generationData, error: generationError } = await supabase.functions.invoke('generate-story', {
        body: {
          storyId: storyId,
          objective: formData.objective,
          childrenNames: childrenNames
        }
      });
      
      if (generationError) {
        console.error('Erreur lors de l\'appel à la fonction de génération d\'histoire:', generationError);
        
        // Mettre à jour l'histoire avec une erreur
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: generationError.message || 'Erreur lors de la génération',
            updatedat: new Date().toISOString()
          })
          .eq('id', storyId);
        
        toast({
          title: "Erreur de génération",
          description: generationError.message || "La génération de l'histoire a échoué",
          variant: "destructive",
        });
      } else {
        console.log('Génération d\'histoire terminée:', generationData);
        toast({
          title: "Histoire générée",
          description: "Votre histoire est maintenant disponible dans votre bibliothèque.",
        });
      }
      
      return storyId;
    } catch (error: any) {
      console.error('❌ Erreur durant la création d\'histoire:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error 
          ? error.message 
          : "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  return {
    createStory
  };
};
