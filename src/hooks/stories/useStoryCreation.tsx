
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

/**
 * Hook pour gérer la création des histoires
 */
export const useStoryCreation = () => {
  const { user } = useSupabaseAuth();

  /**
   * Créer une nouvelle histoire
   */
  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('Creating a new story with form data:', formData);
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('Selected children for story:', childrenNames);
      
      if (!formData.objective) {
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      // Insérer l'histoire avec le statut "en attente"
      const { data: story, error: insertError } = await supabase
        .from('stories')
        .insert({
          title: 'Nouvelle histoire en cours de création...',
          content: '',
          summary: '',
          preview: '',
          status: 'pending',
          childrenids: formData.childrenIds,
          childrennames: childrenNames,
          objective: formData.objective,
          authorid: user.id,
          createdat: new Date().toISOString(),
          updatedat: new Date().toISOString()
        })
        .select()
        .single();
        
      if (insertError) throw insertError;
      
      console.log('Story created with ID:', story.id, 'Now calling generateStory function...');
      
      // Appeler la fonction edge CORRIGÉE avec le bon nom
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generateStory',  // CORRECTION: Utiliser 'generateStory' au lieu de 'generate-story'
        {
          body: {
            storyId: story.id,
            objective: formData.objective,
            childrenNames: childrenNames
          },
        }
      );
      
      if (functionError) {
        console.error('Function error:', functionError);
        // Mettre à jour l'histoire avec le statut d'erreur
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: functionError.message || 'Erreur lors de l\'appel à la fonction generateStory'
          })
          .eq('id', story.id);
          
        throw functionError;
      }
      
      console.log('Function called successfully:', functionData);
      return story.id;
    } catch (error: any) {
      console.error('❌ Error during story creation:', error);
      throw error;
    }
  }, [user]);

  return {
    createStory
  };
};
