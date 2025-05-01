
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "./use-toast";
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Story } from '@/types/story';

export const useSupabaseStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadStories = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('authorid', user.id)
          .order('createdat', { ascending: false });
        
        if (error) throw new Error(error.message);
        
        // Transformer les données pour correspondre au type Story
        const loadedStories = data.map(story => ({
          id: story.id,
          title: story.title || 'Nouvelle histoire',
          content: story.content || '',
          summary: story.summary || '',
          preview: story.preview || '',
          status: story.status || 'completed',
          childrenIds: story.childrenids || [],
          childrenNames: story.childrennames || [],
          objective: story.objective || '',
          authorId: story.authorid,
          createdAt: new Date(story.createdat),
          updatedAt: story.updatedat ? new Date(story.updatedat) : new Date(),
          story_text: story.content || '', // Pour la compatibilité
          story_summary: story.summary || '', // Pour la compatibilité
        })) as Story[];
        
        setStories(loadedStories);
      } catch (err: any) {
        console.error("Erreur lors du chargement des histoires:", err);
        setError(err);
        
        toast({
          title: "Erreur",
          description: "Impossible de charger vos histoires",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadStories();
    
    // Configurer une souscription en temps réel pour les mises à jour
    const channel = supabase
      .channel('stories_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `authorid=eq.${user.id}`
      }, (payload) => {
        loadStories();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

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
      
      // Appeler la fonction edge pour générer l'histoire
      const { data: functionData, error: functionError } = await supabase.functions.invoke(
        'generate-story',
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
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: functionError.message
          })
          .eq('id', story.id);
          
        throw functionError;
      }
      
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire, merci de patienter...",
      });
      
      return story.id;
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
        .eq('authorid', user.id);
        
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
        updatedat: new Date().toISOString()
      };
      
      // Add error details if provided
      if (status === 'error' && errorDetails) {
        updateData.error = errorDetails;
      }
      
      const { error } = await supabase
        .from('stories')
        .update(updateData)
        .eq('id', storyId)
        .eq('authorid', user.id);
        
      if (error) throw error;
      
      console.log('✅ Story status updated successfully');
    } catch (error: any) {
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
      
      // Mettre à jour le statut à "pending"
      await updateStoryStatus(storyId, 'pending');
      
      // Appeler la fonction edge pour réessayer
      const { data, error } = await supabase.functions.invoke('retry-story', {
        body: { storyId }
      });
      
      if (error) {
        // Mettre à jour le statut à "error"
        await updateStoryStatus(storyId, 'error', error.message);
        throw error;
      }
      
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
    stories,
    isLoading: loading,
    error,
    createStory,
    deleteStory,
    updateStoryStatus,
    retryStoryGeneration
  };
};

export default useSupabaseStories;
