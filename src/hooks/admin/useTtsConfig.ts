import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TtsConfig {
  provider: string;
  webhookUrl: string;
  voiceId: string | null;
}

interface TtsMetrics {
  provider: string;
  total_generations: number;
  avg_duration: number;
  avg_file_size: number;
  success_rate: number;
  last_generation: string;
}

export const useTtsConfig = () => {
  const { toast } = useToast();
  const [config, setConfig] = useState<TtsConfig | null>(null);
  const [metrics, setMetrics] = useState<TtsMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchConfig = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.functions.invoke('get-tts-config');
      
      if (error) throw error;
      
      setConfig(data);
    } catch (error: any) {
      console.error('Error fetching TTS config:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer la configuration TTS',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchMetrics = async () => {
    try {
      // Récupérer les métriques depuis audio_files
      const { data, error } = await supabase
        .from('audio_files')
        .select('status, duration, file_size, created_at, voice_id')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Grouper par provider (basé sur voice_id ou autre indicateur)
      const grouped = data?.reduce((acc: any, file: any) => {
        const provider = file.voice_id?.includes('elevenlabs') || file.voice_id === '9BWtsMINqrJLrRacOk9x' ? 'elevenlabs' : 'speechify';
        
        if (!acc[provider]) {
          acc[provider] = {
            provider,
            total_generations: 0,
            total_duration: 0,
            total_file_size: 0,
            successes: 0,
            last_generation: file.created_at,
          };
        }
        
        acc[provider].total_generations++;
        if (file.status === 'ready') {
          acc[provider].successes++;
          if (file.duration) acc[provider].total_duration += file.duration;
          if (file.file_size) acc[provider].total_file_size += file.file_size;
        }
        
        return acc;
      }, {});

      const metricsArray = Object.values(grouped || {}).map((g: any) => ({
        provider: g.provider,
        total_generations: g.total_generations,
        avg_duration: g.successes > 0 ? Math.round(g.total_duration / g.successes) : 0,
        avg_file_size: g.successes > 0 ? Math.round(g.total_file_size / g.successes / 1024) : 0,
        success_rate: g.total_generations > 0 ? Math.round((g.successes / g.total_generations) * 100) : 0,
        last_generation: g.last_generation,
      }));

      setMetrics(metricsArray);
    } catch (error: any) {
      console.error('Error fetching TTS metrics:', error);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchMetrics();
  }, []);

  return {
    config,
    metrics,
    loading,
    refreshing,
    refreshConfig: fetchConfig,
    refreshMetrics: fetchMetrics,
  };
};
