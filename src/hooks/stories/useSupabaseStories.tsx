
import { useState, useEffect } from 'react';
import type { Story } from '@/types/story';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useSupabaseStories = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
          .eq('authorId', user.id)
          .order('createdAt', { ascending: false });
        
        if (error) throw error;
        
        // Transformer les données pour correspondre au type Story
        const loadedStories = data.map(story => ({
          id: story.id,
          title: story.title || 'Nouvelle histoire',
          content: story.content || story.story_text || '',
          summary: story.summary || story.story_summary || '',
          preview: story.preview || '',
          status: story.status || 'completed',
          childrenIds: story.childrenIds || [],
          objective: story.objective || '',
          authorId: story.authorId,
          createdAt: new Date(story.createdAt),
          updatedAt: story.updatedAt ? new Date(story.updatedAt) : new Date()
        })) as Story[];
        
        setStories(loadedStories);
      } catch (err) {
        console.error("Erreur lors du chargement des histoires:", err);
        setError("Impossible de charger les histoires");
        toast({
          title: "Erreur",
          description: "Impossible de charger les histoires",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadStories();
    
    // Configurer une souscription en temps réel pour les mises à jour
    const subscription = supabase
      .channel('stories_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `authorId=eq.${user.id}`
      }, loadStories)
      .subscribe();
    
    return () => {
      subscription.unsubscribe();
    };
  }, [user, toast]);

  return {
    stories,
    loading,
    error,
    isLoading: loading,
  };
};
