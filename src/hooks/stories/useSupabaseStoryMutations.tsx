
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useSupabaseStoryMutations = () => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const createStory = useCallback(async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('🚀 Starting story creation process...', {
        formData,
        currentUser: user.id
      });
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('Selected children for story:', childrenNames);
      
      if (!formData.objective) {
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      // Créer l'histoire avec statut en attente
      const storyData = {
        title: 'Nouvelle histoire en cours de génération...',
        content: '',
        summary: 'Génération en cours...',
        preview: '',
        status: 'pending',
        childrenIds: formData.childrenIds,
        childrenNames: childrenNames,
        objective: formData.objective,
        authorId: user.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('stories')
        .insert(storyData)
        .select('id')
        .single();
      
      if (error) throw error;
      
      const storyId = data.id;
      console.log('Initial story document created with ID:', storyId);
      
      // Appeler la fonction edge pour générer l'histoire
      const { data: generationData, error: generationError } = await supabase.functions.invoke('generateStory', {
        body: {
          storyId: storyId,
          objective: formData.objective,
          childrenNames: childrenNames
        }
      });
      
      if (generationError) {
        console.error('Error calling story generation function:', generationError);
        
        // Mettre à jour l'histoire avec une erreur
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: generationError.message || 'Erreur lors de la génération',
            updatedAt: new Date().toISOString()
          })
          .eq('id', storyId);
        
        toast({
          title: "Erreur de génération",
          description: generationError.message || "La génération de l'histoire a échoué",
          variant: "destructive",
        });
        
        return storyId;
      }
      
      console.log('Story generation completed:', generationData);
      
      // Mettre à jour l'histoire avec le contenu généré
      await supabase
        .from('stories')
        .update({
          title: generationData.title || 'Nouvelle histoire',
          content: generationData.story_text || '',
          summary: generationData.story_summary || '',
          preview: generationData.preview || '',
          status: 'completed',
          updatedAt: new Date().toISOString()
        })
        .eq('id', storyId);
      
      toast({
        title: "Histoire générée",
        description: "Votre histoire est maintenant disponible dans votre bibliothèque.",
      });
      
      return storyId;
    } catch (error: any) {
      console.error('❌ Error during story creation:', error);
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

  const deleteStory = useCallback(async (storyId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Deleting story: ${storyId}`);
      
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('authorId', user.id);
      
      if (error) throw error;
      
      console.log('Story deleted successfully');
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error: any) {
      console.error('Error deleting story:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  }, [user, toast]);

  const updateStoryStatus = useCallback(async (storyId: string, status: 'pending' | 'completed' | 'read' | 'error', errorDetails?: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Updating story status: ${storyId} -> ${status}`);
      
      const updateData: any = {
        status,
        updatedAt: new Date().toISOString()
      };
      
      // Ajouter les détails d'erreur si fournis
      if (status === 'error' && errorDetails) {
        updateData.error = errorDetails;
      }
      
      const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .eq('authorId', user.id);
      
      if (error) throw error;
      
      console.log('✅ Story status updated successfully');
    } catch (error) {
      console.error('❌ Error updating story status:', error);
      throw error;
    }
  }, [user]);

  const retryStoryGeneration = useCallback(async (storyId: string) => {
    if (!user) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Retrying story generation for: ${storyId}`);
      
      // Mettre à jour le statut de l'histoire à "en attente"
      await updateStoryStatus(storyId, 'pending');
      
      // Obtenir les informations de l'histoire
      const { data: storyData, error: storyError } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .eq('authorId', user.id)
        .single();
      
      if (storyError) throw storyError;
      
      // Appeler la fonction edge pour régénérer l'histoire
      const { data: generationData, error: generationError } = await supabase.functions.invoke('retryStory', {
        body: {
          storyId: storyId,
          objective: storyData.objective,
          childrenNames: storyData.childrenNames
        }
      });
      
      if (generationError) {
        console.error('Error retrying story generation:', generationError);
        
        // Mettre à jour l'histoire avec une erreur
        await updateStoryStatus(storyId, 'error', generationError.message);
        
        toast({
          title: "Erreur",
          description: "La nouvelle tentative a échoué: " + generationError.message,
          variant: "destructive",
        });
        
        throw generationError;
      }
      
      // Mettre à jour l'histoire avec le contenu régénéré
      await supabase
        .from('stories')
        .update({
          title: generationData.title || storyData.title,
          content: generationData.story_text || '',
          summary: generationData.story_summary || '',
          preview: generationData.preview || '',
          status: 'completed',
          updatedAt: new Date().toISOString()
        })
        .eq('id', storyId);
      
      toast({
        title: "Nouvelle tentative",
        description: "La régénération de l'histoire a réussi",
      });
      
      return generationData;
    } catch (error) {
      console.error('Error retrying story generation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry story generation';
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  }, [user, toast, updateStoryStatus]);

  return {
    createStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration
  };
};
