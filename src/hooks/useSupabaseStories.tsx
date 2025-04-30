
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Story } from '@/types/story';

export const useSupabaseStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user, session, loading: authLoading } = useSupabaseAuth();

  // Récupérer les histoires lorsque l'utilisateur est authentifié
  useEffect(() => {
    if (authLoading) return; // Attendre que l'état d'auth soit déterminé
    
    if (!user) {
      console.log("Pas d'utilisateur connecté, réinitialisation des histoires");
      setStories([]);
      setIsLoading(false);
      return;
    }
    
    console.log("Utilisateur connecté, chargement des histoires:", user.id);
    fetchStories();
  }, [user, authLoading]);

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!user || !user.id) {
        console.error('Utilisateur non connecté ou ID utilisateur manquant');
        setIsLoading(false);
        return;
      }

      console.log("Récupération des histoires pour l'utilisateur:", user.id);
      const { data, error } = await supabase
        .from('stories')
        .select('*')
        .eq('authorid', user.id)
        .order('createdat', { ascending: false });

      if (error) {
        throw error;
      }

      console.log(`${data?.length || 0} histoires trouvées pour l'utilisateur:`, user.id);
      setStories(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des histoires:', err);
      setError(err);
      
      toast({
        title: "Erreur",
        description: "Impossible de charger vos histoires",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createStory = async (formData: { childrenIds: string[], objective: string }, children = []) => {
    try {
      console.log("Début de la création d'histoire, vérification de l'authentification", {
        userExists: !!user,
        userId: user?.id,
        sessionExists: !!session
      });
      
      if (!user) {
        console.error("Erreur: Tentative de création d'histoire sans authentification");
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour créer une histoire",
          variant: "destructive",
        });
        throw new Error("Utilisateur non connecté");
      }

      console.log('Création d\'une nouvelle histoire:', formData);
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log("Enfants sélectionnés:", childrenNames);
      
      // Créer l'enregistrement d'histoire dans Supabase
      console.log("Insertion d'une nouvelle histoire dans Supabase");
      const { data, error } = await supabase
        .from('stories')
        .insert({
          title: `Nouvelle histoire pour ${childrenNames.join(', ')}`,
          content: '',
          summary: 'Génération en cours...',
          preview: 'Histoire en cours de création...',
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
      
      if (error) {
        console.error("Erreur d'insertion:", error);
        throw error;
      }
      
      console.log("Histoire créée avec succès, ID:", data.id);
      
      toast({
        title: "Création en cours",
        description: "Votre histoire est en cours de génération",
      });
      
      // Appeler la fonction Edge pour générer l'histoire
      try {
        console.log("Appel de la fonction Edge generateStory");
        const { data: functionData, error: functionError } = await supabase.functions.invoke(
          'generateStory',
          {
            body: {
              storyId: data.id,
              objective: formData.objective,
              childrenNames: childrenNames
            },
          }
        );
        
        if (functionError) {
          console.error('Erreur lors de l\'appel à la fonction Edge:', functionError);
          throw functionError;
        }
        
        console.log('Réponse de la fonction Edge:', functionData);
        
        // Rafraîchir la liste d'histoires
        fetchStories();
        
        return data.id;
      } catch (functionErr: any) {
        console.error('Erreur lors de l\'appel à la fonction Edge:', functionErr);
        
        // Mettre à jour le statut de l'histoire en cas d'erreur
        await supabase
          .from('stories')
          .update({
            status: 'error',
            error: functionErr instanceof Error ? functionErr.message : 'Erreur inconnue',
            updatedat: new Date().toISOString()
          })
          .eq('id', data.id);
        
        toast({
          title: "Erreur",
          description: "La génération de l'histoire a échoué",
          variant: "destructive",
        });
        
        throw functionErr;
      }
    } catch (err: any) {
      console.error('Erreur lors de la création de l\'histoire:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw err;
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      if (!user) {
        throw new Error("Utilisateur non connecté");
      }
      
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('authorid', user.id);
      
      if (error) throw error;
      
      // Mettre à jour la liste des histoires
      setStories(prev => prev.filter(story => story.id !== storyId));
      
      toast({
        title: "Histoire supprimée",
        description: "L'histoire a été supprimée avec succès",
      });
    } catch (err: any) {
      console.error('Erreur lors de la suppression de l\'histoire:', err);
      toast({
        title: "Erreur",
        description: err.message || "Impossible de supprimer l'histoire",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    stories: {
      stories,
      isLoading,
      error,
    },
    fetchStories,
    createStory,
    deleteStory,
  };
};
