
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Story } from '@/types/story';
import { formatStoryFromSupabase } from './storyFormatters';

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user, loading: authLoading } = useSupabaseAuth();

  // Charger les histoires lors du montage du composant
  useEffect(() => {
    if (authLoading) return; // Attendre que l'état d'authentification soit déterminé
    
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
      
      // Transformer les données pour correspondre au type Story
      const formattedStories = data?.map(story => formatStoryFromSupabase(story)) || [];
      setStories(formattedStories);
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

  return {
    stories,
    isLoading,
    error,
    fetchStories,
  };
};
