
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { formatStoriesFromSupabase } from './storyFormatters';
import type { Story } from '@/types/story';

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    if (!user) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    fetchStories();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('stories_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'stories',
        filter: `authorid=eq.${user.id}`
      }, (payload) => {
        console.log("Real-time update received:", payload);
        fetchStories();
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const fetchStories = async () => {
    if (!user) return;
    
    try {
      console.log("Fetching stories for user:", user.id);
      setIsLoading(true);
      setError(null);
      
      const { data, error: queryError } = await supabase
        .from('stories')
        .select('*')
        .eq('authorid', user.id)
        .order('createdat', { ascending: false });
      
      if (queryError) {
        console.error("Error fetching stories:", queryError);
        throw queryError;
      }
      
      console.log(`Found ${data?.length || 0} stories for user ${user.id}`);
      
      const formattedStories = formatStoriesFromSupabase(data || []);
      setStories(formattedStories);
    } catch (err: any) {
      console.error("Error in useStoriesQuery:", err);
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

  return { stories, isLoading, error, fetchStories };
};
