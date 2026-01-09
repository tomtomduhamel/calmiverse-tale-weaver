/**
 * Hook to fetch complete series details including all stories
 * Used when user clicks on a series tome in the feed
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Story, StorySeries, SeriesGroup } from '@/types/story';

interface UseSeriesDetailsReturn {
  seriesGroup: SeriesGroup | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useSeriesDetails = (seriesId: string | null): UseSeriesDetailsReturn => {
  const [seriesGroup, setSeriesGroup] = useState<SeriesGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeriesDetails = useCallback(async () => {
    if (!seriesId) {
      setSeriesGroup(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Fetch series info and stories in parallel
      const [seriesResult, storiesResult] = await Promise.all([
        supabase
          .from('story_series')
          .select('*')
          .eq('id', seriesId)
          .single(),
        supabase
          .from('stories')
          .select('*')
          .eq('series_id', seriesId)
          .order('tome_number', { ascending: true })
      ]);

      if (seriesResult.error) throw seriesResult.error;
      if (storiesResult.error) throw storiesResult.error;

      const series: StorySeries = {
        id: seriesResult.data.id,
        title: seriesResult.data.title,
        description: seriesResult.data.description,
        author_id: seriesResult.data.author_id,
        total_tomes: seriesResult.data.total_tomes,
        is_active: seriesResult.data.is_active,
        created_at: new Date(seriesResult.data.created_at),
        updated_at: new Date(seriesResult.data.updated_at),
        image_path: seriesResult.data.image_path
      };

      // Map stories to Story type
      const stories: Story[] = storiesResult.data.map(s => ({
        id: s.id,
        title: s.title,
        content: s.content || '',
        preview: s.preview || '',
        status: s.status as Story['status'],
        authorId: s.authorid,
        childrenIds: s.childrenids || [],
        childrenNames: s.childrennames || [],
        createdAt: new Date(s.createdat),
        updatedAt: s.updatedat ? new Date(s.updatedat) : undefined,
        objective: s.objective || '',
        story_summary: s.summary || '',
        summary: s.summary,
        image_path: s.image_path,
        sound_id: s.sound_id,
        story_analysis: s.story_analysis as Story['story_analysis'],
        sharing: s.sharing as Story['sharing'],
        isFavorite: s.is_favorite || false,
        series_id: s.series_id,
        tome_number: s.tome_number,
        is_series_starter: s.is_series_starter,
        previous_story_id: s.previous_story_id,
        next_story_id: s.next_story_id,
        error: s.error,
        deduplication_key: s.deduplication_key
      }));

      // Calculate read stories
      const readStories = stories.filter(s => s.status === 'read').length;
      
      // Get last updated date
      const lastUpdated = stories.reduce((latest, story) => {
        const storyDate = story.updatedAt ? story.updatedAt.toISOString() : story.createdAt.toISOString();
        return storyDate > latest ? storyDate : latest;
      }, stories[0]?.updatedAt?.toISOString() || stories[0]?.createdAt.toISOString() || new Date().toISOString());

      const group: SeriesGroup = {
        id: seriesId,
        type: 'series',
        series,
        stories,
        totalStories: stories.length,
        readStories,
        lastUpdated,
        coverImage: series.image_path || stories[0]?.image_path || undefined
      };

      setSeriesGroup(group);
    } catch (err: any) {
      console.error('❌ Error fetching series details:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    fetchSeriesDetails();
  }, [fetchSeriesDetails]);

  return { 
    seriesGroup, 
    isLoading, 
    error, 
    refetch: fetchSeriesDetails 
  };
};
