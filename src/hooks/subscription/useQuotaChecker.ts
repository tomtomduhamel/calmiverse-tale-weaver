import { useState } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { QuotaStatus } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

export const useQuotaChecker = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const checkQuota = async (quotaType: 'stories' | 'audio' | 'children'): Promise<QuotaStatus | null> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      setLoading(true);

      const { data, error } = await supabase.rpc('check_user_quota', {
        p_user_id: user.id,
        p_quota_type: quotaType
      });

      if (error) throw error;

      return data as QuotaStatus;
    } catch (err: any) {
      console.error('Error checking quota:', err);
      toast({
        title: "Erreur",
        description: "Impossible de vérifier vos quotas",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const incrementUsage = async (usageType: 'story' | 'audio'): Promise<boolean> => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('increment_usage', {
        p_user_id: user.id,
        p_usage_type: usageType
      });

      if (error) throw error;

      return data;
    } catch (err: any) {
      console.error('Error incrementing usage:', err);
      return false;
    }
  };

  const validateAction = async (action: 'create_story' | 'generate_audio' | 'add_child'): Promise<{ allowed: boolean; reason?: string; quotaStatus?: QuotaStatus }> => {
    const quotaMap = {
      'create_story': 'stories' as const,
      'generate_audio': 'audio' as const,
      'add_child': 'children' as const
    };

    const quotaStatus = await checkQuota(quotaMap[action]);
    
    if (!quotaStatus) {
      return { allowed: false, reason: 'Erreur lors de la vérification des quotas' };
    }

    if (!quotaStatus.allowed) {
      const messages = {
        'create_story': `Vous avez atteint votre limite mensuelle d'histoires (${quotaStatus.used}/${quotaStatus.limit}). Passez à un abonnement supérieur pour créer plus d'histoires.`,
        'generate_audio': `Vous avez atteint votre limite mensuelle de génération audio (${quotaStatus.used}/${quotaStatus.limit}). Passez à un abonnement supérieur pour plus de générations audio.`,
        'add_child': `Vous avez atteint votre limite d'enfants (${quotaStatus.used}/${quotaStatus.limit}). Passez à un abonnement supérieur pour ajouter plus d'enfants.`
      };

      return { 
        allowed: false, 
        reason: messages[action],
        quotaStatus 
      };
    }

    return { allowed: true, quotaStatus };
  };

  return {
    checkQuota,
    incrementUsage,
    validateAction,
    loading
  };
};