
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useStoryCreation = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      console.error("Error: Trying to create a story without authentication");
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('Creating story with data:', formData);
      
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
          title: `Histoire en cours de création pour ${childrenNames.join(' et ')}`,
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
        
      if (insertError) {
        console.error("Error inserting story:", insertError);
        throw insertError;
      }
      
      console.log("Story created successfully, calling edge function:", story);
      
      // Appeler la fonction edge pour générer l'histoire
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generateStory',
        {
          body: {
            storyId: story.id,
            objective: formData.objective,
            childrenNames: childrenNames
          },
        }
      );
      
      if (functionError) {
        // Mettre à jour l'histoire avec le statut d'erreur
        console.error("Error calling generateStory function:", functionError);
        
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: functionError.message || "Erreur lors de l'appel à la fonction de génération",
            updatedat: new Date().toISOString()
          })
          .eq('id', story.id);
          
        throw functionError;
      }
      
      console.log("Generation started successfully:", functionData);
      
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire, merci de patienter...",
      });
      
      return {
        storyId: story.id
      };
    } catch (error: any) {
      console.error('Error during story creation:', error);
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
