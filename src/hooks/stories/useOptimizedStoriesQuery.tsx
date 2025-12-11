import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { formatStoriesFromSupabase } from './storyFormatters';
import type { Story } from '@/types/story';

interface CacheEntry {
  data: Story[];
  timestamp: number;
}

const CACHE_TTL = 30000; // 30 seconds cache
const DEBOUNCE_DELAY = 500; // 500ms debounce

export const useOptimizedStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useSupabaseAuth();
  
  // Cache and optimization refs
  const cacheRef = useRef<CacheEntry | null>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fetchingRef = useRef<boolean>(false);
  const lastFetchRef = useRef<number>(0);

  const isDataFresh = useCallback(() => {
    if (!cacheRef.current) return false;
    const now = Date.now();
    return (now - cacheRef.current.timestamp) < CACHE_TTL;
  }, []);

  const debouncedFetchStories = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    debounceTimeoutRef.current = setTimeout(() => {
      fetchStories();
    }, DEBOUNCE_DELAY);
  }, []);

  const fetchStories = useCallback(async (forceRefresh = false) => {
    if (!user) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    // Prevent duplicate requests
    if (fetchingRef.current) return;

    // Use cache if data is fresh and not forcing refresh
    if (!forceRefresh && isDataFresh() && cacheRef.current) {
      setStories(cacheRef.current.data);
      setIsLoading(false);
      return;
    }

    // Rate limiting: max 1 request per 2 seconds
    const now = Date.now();
    if (!forceRefresh && (now - lastFetchRef.current) < 2000) {
      return;
    }

    try {
      fetchingRef.current = true;
      lastFetchRef.current = now;
      
      if (stories.length === 0) {
        setIsLoading(true);
      }
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
      
      const formattedStories = formatStoriesFromSupabase(data || []);
      
      // Update cache
      cacheRef.current = {
        data: formattedStories,
        timestamp: now
      };
      
      setStories(formattedStories);
    } catch (err: any) {
      console.error("Error in optimized stories query:", err);
      setError(err);
      
      // Only show toast for actual errors, not network issues
      if (!err.message?.includes('network')) {
        toast({
          title: "Erreur",
          description: "Impossible de charger vos histoires",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
      fetchingRef.current = false;
    }
  }, [user, toast, isDataFresh, stories.length]);

  useEffect(() => {
    if (!user) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    fetchStories();
    
    // Optimized real-time subscription with selective updates
    const channel = supabase
      .channel('stories_changes_optimized')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stories',
        filter: `authorid=eq.${user.id}`
      }, (payload) => {
        console.log("New story inserted:", payload.new);
        // Add new story to existing list instead of full refresh
        if (payload.new && cacheRef.current) {
          const newStory = formatStoriesFromSupabase([payload.new as any])[0];
          setStories(prev => [newStory, ...prev]);
          
          // Update cache
          cacheRef.current = {
            data: [newStory, ...cacheRef.current.data],
            timestamp: Date.now()
          };
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'stories',
        filter: `authorid=eq.${user.id}`
      }, (payload) => {
        console.log("Story updated:", payload.new);
        // Update specific story instead of full refresh
        if (payload.new && cacheRef.current) {
          const updatedStory = formatStoriesFromSupabase([payload.new as any])[0];
          setStories(prev => 
            prev.map(story => 
              story.id === updatedStory.id ? updatedStory : story
            )
          );
          
          // Update cache
          cacheRef.current = {
            data: cacheRef.current.data.map(story => 
              story.id === updatedStory.id ? updatedStory : story
            ),
            timestamp: Date.now()
          };
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'stories',
        filter: `authorid=eq.${user.id}`
      }, (payload) => {
        console.log("Story deleted:", payload.old);
        // Remove story from list instead of full refresh
        if (payload.old && cacheRef.current) {
          const deletedId = payload.old.id;
          setStories(prev => prev.filter(story => story.id !== deletedId));
          
          // Update cache
          cacheRef.current = {
            data: cacheRef.current.data.filter(story => story.id !== deletedId),
            timestamp: Date.now()
          };
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [user, fetchStories]);

  // Force refresh function for manual updates
  const forceRefresh = useCallback(() => {
    cacheRef.current = null; // Clear cache
    fetchStories(true);
  }, [fetchStories]);

  // Remove story from list (optimistic update after deletion)
  const removeStoryFromList = useCallback((storyId: string) => {
    setStories(prev => prev.filter(story => story.id !== storyId));
    if (cacheRef.current) {
      cacheRef.current = {
        data: cacheRef.current.data.filter(story => story.id !== storyId),
        timestamp: Date.now()
      };
    }
  }, []);

  return { 
    stories, 
    isLoading, 
    error, 
    fetchStories: debouncedFetchStories,
    forceRefresh,
    removeStoryFromList
  };
};