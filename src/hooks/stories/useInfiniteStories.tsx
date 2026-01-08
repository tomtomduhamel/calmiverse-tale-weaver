/**
 * Hook for infinite scroll stories fetching with Supabase pagination
 * Optimized for Instagram-like feed performance
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { Story } from "@/types/story";

const PAGE_SIZE = 10;

interface UseInfiniteStoriesOptions {
  statusFilter?: 'all' | 'pending' | 'ready' | 'read' | 'unread' | 'error' | 'favorites' | 'recent';
  objectiveFilter?: string | null;
  searchTerm?: string;
}

interface UseInfiniteStoriesReturn {
  stories: Story[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  fetchNextPage: () => Promise<void>;
  refresh: () => Promise<void>;
  toggleFavorite: (storyId: string, currentStatus: boolean) => Promise<void>;
  deleteStory: (storyId: string) => Promise<void>;
}

// Helper to format story from Supabase row
const formatStoryFromRow = (row: any): Story => ({
  id: row.id,
  title: row.title || "Sans titre",
  preview: row.preview || "",
  objective: row.objective || "",
  childrenIds: row.childrenids || [],
  childrenNames: row.childrennames || [],
  createdAt: new Date(row.createdat),
  updatedAt: row.updatedat ? new Date(row.updatedat) : undefined,
  status: row.status || "pending",
  content: row.content || "",
  story_summary: row.summary || "",
  authorId: row.authorid,
  isFavorite: row.is_favorite || false,
  error: row.error,
  image_path: row.image_path,
  sound_id: row.sound_id,
  series_id: row.series_id,
  tome_number: row.tome_number,
  is_series_starter: row.is_series_starter,
  previous_story_id: row.previous_story_id,
  next_story_id: row.next_story_id,
});

export function useInfiniteStories(options: UseInfiniteStoriesOptions = {}): UseInfiniteStoriesReturn {
  const { user } = useSupabaseAuth();
  const { statusFilter = 'all', objectiveFilter, searchTerm } = options;
  
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentPage = useRef(0);
  const isFetching = useRef(false);

  // Build query based on filters
  const buildQuery = useCallback((start: number, end: number) => {
    // Only select necessary columns for feed performance
    let query = supabase
      .from('stories')
      .select('id, title, preview, objective, image_path, createdat, updatedat, status, is_favorite, content, childrenids, childrennames, authorid, error, sound_id, series_id, tome_number, is_series_starter, previous_story_id, next_story_id, summary')
      .eq('authorid', user?.id || '')
      .order('createdat', { ascending: false })
      .range(start, end);

    // Apply status filter
    if (statusFilter === 'favorites') {
      query = query.eq('is_favorite', true);
    } else if (statusFilter === 'read') {
      query = query.eq('status', 'read');
    } else if (statusFilter === 'unread') {
      query = query.neq('status', 'read').neq('status', 'error');
    } else if (statusFilter === 'pending') {
      query = query.eq('status', 'pending');
    } else if (statusFilter === 'error') {
      query = query.eq('status', 'error');
    } else if (statusFilter === 'recent') {
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);
      query = query.gte('createdat', twentyFourHoursAgo.toISOString());
    }

    // Apply objective filter
    if (objectiveFilter) {
      query = query.eq('objective', objectiveFilter);
    }

    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      query = query.or(`title.ilike.%${searchTerm}%,preview.ilike.%${searchTerm}%`);
    }

    return query;
  }, [user?.id, statusFilter, objectiveFilter, searchTerm]);

  // Fetch stories
  const fetchStories = useCallback(async (isInitial: boolean = false) => {
    if (!user?.id || isFetching.current) return;
    
    isFetching.current = true;
    
    if (isInitial) {
      setIsLoading(true);
      currentPage.current = 0;
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      const start = currentPage.current * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error: fetchError } = await buildQuery(start, end);

      if (fetchError) {
        throw fetchError;
      }

      const formattedStories = (data || []).map(formatStoryFromRow);
      
      if (isInitial) {
        setStories(formattedStories);
      } else {
        setStories(prev => [...prev, ...formattedStories]);
      }

      // Check if there are more stories
      setHasMore(formattedStories.length === PAGE_SIZE);
      currentPage.current += 1;

    } catch (err: any) {
      console.error('[useInfiniteStories] Error fetching stories:', err);
      setError(err.message || 'Erreur lors du chargement des histoires');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetching.current = false;
    }
  }, [user?.id, buildQuery]);

  // Fetch next page
  const fetchNextPage = useCallback(async () => {
    if (!hasMore || isLoadingMore || isFetching.current) return;
    await fetchStories(false);
  }, [fetchStories, hasMore, isLoadingMore]);

  // Refresh (reset and fetch from beginning)
  const refresh = useCallback(async () => {
    await fetchStories(true);
  }, [fetchStories]);

  // Toggle favorite
  const toggleFavorite = useCallback(async (storyId: string, currentStatus: boolean) => {
    if (!user?.id) return;

    // Optimistic update
    setStories(prev => prev.map(story => 
      story.id === storyId ? { ...story, isFavorite: !currentStatus } : story
    ));

    try {
      const { error: updateError } = await supabase
        .from('stories')
        .update({ is_favorite: !currentStatus })
        .eq('id', storyId)
        .eq('authorid', user.id);

      if (updateError) throw updateError;
    } catch (err) {
      // Revert on error
      setStories(prev => prev.map(story => 
        story.id === storyId ? { ...story, isFavorite: currentStatus } : story
      ));
      console.error('[useInfiniteStories] Toggle favorite error:', err);
    }
  }, [user?.id]);

  // Delete story
  const deleteStory = useCallback(async (storyId: string) => {
    if (!user?.id) return;

    // Optimistic update
    const storyToDelete = stories.find(s => s.id === storyId);
    setStories(prev => prev.filter(story => story.id !== storyId));

    try {
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)
        .eq('authorid', user.id);

      if (deleteError) throw deleteError;
    } catch (err) {
      // Revert on error
      if (storyToDelete) {
        setStories(prev => [...prev, storyToDelete].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
      console.error('[useInfiniteStories] Delete story error:', err);
      throw err;
    }
  }, [user?.id, stories]);

  // Initial fetch when filters change
  useEffect(() => {
    if (user?.id) {
      fetchStories(true);
    }
  }, [user?.id, statusFilter, objectiveFilter, searchTerm]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('stories-feed-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'stories',
          filter: `authorid=eq.${user.id}`
        },
        (payload) => {
          console.log('[useInfiniteStories] Realtime update:', payload.eventType);
          
          if (payload.eventType === 'INSERT') {
            const newStory = formatStoryFromRow(payload.new);
            setStories(prev => [newStory, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedStory = formatStoryFromRow(payload.new);
            setStories(prev => prev.map(story => 
              story.id === updatedStory.id ? updatedStory : story
            ));
          } else if (payload.eventType === 'DELETE') {
            setStories(prev => prev.filter(story => story.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    stories,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchNextPage,
    refresh,
    toggleFavorite,
    deleteStory,
  };
}
