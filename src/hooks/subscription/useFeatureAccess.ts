import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

export type Feature = 'story_series' | 'background_music' | 'priority_access' | 'community_access' | 'audio_generation';

export const useFeatureAccess = () => {
  const { user } = useSupabaseAuth();
  const [featureAccess, setFeatureAccess] = useState<Record<Feature, boolean>>({
    story_series: false,
    background_music: false,
    priority_access: false,
    community_access: false,
    audio_generation: false
  });
  const [loading, setLoading] = useState(true);

  const checkFeatureAccess = async (feature: Feature): Promise<boolean> => {
    try {
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_feature_access', {
        p_user_id: user.id,
        p_feature: feature
      });

      if (error) throw error;

      return Boolean(data);
    } catch (err: any) {
      console.error('Error checking feature access:', err);
      return false;
    }
  };

  const checkAllFeatures = async () => {
    if (!user) return;

    setLoading(true);
    
    const features: Feature[] = ['story_series', 'background_music', 'priority_access', 'community_access', 'audio_generation'];
    const results: Record<Feature, boolean> = {} as Record<Feature, boolean>;

    for (const feature of features) {
      results[feature] = await checkFeatureAccess(feature);
    }

    setFeatureAccess(results);
    setLoading(false);
  };

  const hasAccess = (feature: Feature): boolean => {
    return featureAccess[feature];
  };

  const requiresUpgrade = (feature: Feature): boolean => {
    return !featureAccess[feature];
  };

  useEffect(() => {
    checkAllFeatures();
  }, [user]);

  return {
    featureAccess,
    hasAccess,
    requiresUpgrade,
    checkFeatureAccess,
    refreshFeatureAccess: checkAllFeatures,
    loading
  };
};