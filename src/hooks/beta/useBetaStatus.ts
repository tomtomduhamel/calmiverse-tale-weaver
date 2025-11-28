import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export type BetaStatus = 'pending_validation' | 'active' | 'rejected' | 'expired' | null;

interface BetaUserInfo {
  id: string;
  status: BetaStatus;
  email: string;
  invitation_code: string;
  requested_at: string;
  validated_at?: string;
  subscription_expires_at?: string;
  rejection_reason?: string;
}

export const useBetaStatus = () => {
  const { user } = useSupabaseAuth();
  const [betaInfo, setBetaInfo] = useState<BetaUserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchBetaStatus = async () => {
    if (!user) {
      setBetaInfo(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('beta_users')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[Beta] Error fetching beta status:', error);
        setBetaInfo(null);
        return;
      }

      if (data) {
        setBetaInfo(data as BetaUserInfo);
      } else {
        setBetaInfo(null);
      }
    } catch (err) {
      console.error('[Beta] Failed to fetch beta status:', err);
      setBetaInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBetaStatus();
  }, [user]);

  const isBetaUser = betaInfo !== null;
  const isPending = betaInfo?.status === 'pending_validation';
  const isActive = betaInfo?.status === 'active';
  const isRejected = betaInfo?.status === 'rejected';
  const isExpired = betaInfo?.status === 'expired';

  return {
    betaInfo,
    loading,
    isBetaUser,
    isPending,
    isActive,
    isRejected,
    isExpired,
    refreshStatus: fetchBetaStatus
  };
};
