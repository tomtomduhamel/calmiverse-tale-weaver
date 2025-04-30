
/**
 * @deprecated Ce hook est maintenu uniquement pour la compatibilité.
 * Utiliser useSupabaseStories à la place.
 */

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import type { Story } from '@/types/story';
import { formatStoryFromSupabase } from './storyFormatters';
import { useToast } from "@/hooks/use-toast";

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) {
      console.log('Pas d\'utilisateur connecté');
      setIsLoading(false);
      setStories([]);
      return;
    }

    console.log('🔄 Initialisation de la requête Supabase:', {
      userId: user.id,
      timestamp: new Date().toISOString()
    });

    setIsLoading(true);

    const fetchStories = async () => {
      try {
        const { data, error } = await supabase
          .from('stories')
          .select('*')
          .eq('authorid', user.id)
          .order('createdat', { ascending: false });

        if (error) throw error;

        console.log('📥 Réception données Supabase:', {
          numberOfStories: data?.length || 0,
          timestamp: new Date().toISOString()
        });

        const loadedStories = data?.map(storyData => {
          try {
            const story = formatStoryFromSupabase(storyData);
            console.log('📄 Histoire chargée:', {
              id: story.id,
              status: story.status,
            });
            return story;
          } catch (err) {
            console.error('❌ Erreur formatage histoire:', {
              storyId: storyData.id,
              error: err
            });
            return null;
          }
        }).filter((story): story is Story => story !== null) || [];

        console.log('📊 Résumé du chargement:', {
          total: loadedStories.length,
          timestamp: new Date().toISOString()
        });

        setStories(loadedStories);
        setError(null);
      } catch (err) {
        console.error('❌ Erreur chargement des histoires:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
        toast({
          title: "Erreur de synchronisation",
          description: "Une erreur est survenue lors de la synchronisation des histoires",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchStories();

    // Configurer un abonnement en temps réel pour les mises à jour (Supabase Realtime)
    const channel = supabase
      .channel('stories_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `authorid=eq.${user.id}`
      }, () => {
        fetchStories();
      })
      .subscribe();

    return () => {
      console.log('🧹 Nettoyage abonnement Supabase');
      supabase.removeChannel(channel);
    };
  }, [toast, user]);

  return { stories, isLoading, error };
};
