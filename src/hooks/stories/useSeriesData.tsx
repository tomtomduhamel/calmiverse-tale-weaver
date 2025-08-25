import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { StorySeries } from '@/types/story';

interface UseSeriesDataReturn {
  seriesData: Map<string, StorySeries>;
  isLoading: boolean;
  error: string | null;
}

export const useSeriesData = (seriesIds: string[]): UseSeriesDataReturn => {
  const [seriesData, setSeriesData] = useState<Map<string, StorySeries>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeriesData = async () => {
      if (seriesIds.length === 0) {
        setSeriesData(new Map());
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('story_series')
          .select('*')
          .in('id', seriesIds);

        if (fetchError) throw fetchError;

        const seriesMap = new Map<string, StorySeries>();
        data?.forEach(series => {
          seriesMap.set(series.id, {
            id: series.id,
            title: series.title,
            description: series.description,
            author_id: series.author_id,
            total_tomes: series.total_tomes,
            is_active: series.is_active,
            created_at: new Date(series.created_at),
            updated_at: new Date(series.updated_at),
            image_path: series.image_path
          });
        });

        setSeriesData(seriesMap);
      } catch (err: any) {
        console.error('❌ Erreur récupération données série:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeriesData();
  }, [seriesIds.join(',')]);

  return { seriesData, isLoading, error };
};