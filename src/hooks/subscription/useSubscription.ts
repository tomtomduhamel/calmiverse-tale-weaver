import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserSubscription, SubscriptionLimits } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';

export const useSubscription = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const { betaInfo, isActive: isBetaActive } = useBetaStatus();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      // Si l'utilisateur est un beta tester actif, utiliser son abonnement beta
      if (isBetaActive && betaInfo) {
        console.log('[useSubscription] Beta user detected - using beta subscription');
        
        // Récupérer le code d'invitation pour obtenir le tier
        const { data: inviteData, error: inviteError } = await supabase
          .from('beta_invitations')
          .select('tier, duration_months')
          .eq('code', betaInfo.invitation_code)
          .single();

        if (inviteError) {
          console.error('[useSubscription] Error fetching beta invitation:', inviteError);
          throw inviteError;
        }

        // Créer un abonnement virtuel pour le beta tester
        const betaSubscription: UserSubscription = {
          id: betaInfo.id,
          user_id: user.id,
          tier: inviteData.tier,
          status: 'active',
          current_period_start: betaInfo.validated_at || betaInfo.requested_at,
          current_period_end: betaInfo.subscription_expires_at || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          stories_used_this_period: 0,
          audio_generations_used_this_period: 0,
          stripe_subscription_id: null,
          is_annual: false,
          created_at: betaInfo.requested_at,
          updated_at: betaInfo.validated_at || betaInfo.requested_at
        };

        setSubscription(betaSubscription);

        // Récupérer les limites pour ce tier
        const { data: limitsData, error: limitsError } = await supabase
          .from('subscription_limits')
          .select('*')
          .eq('tier', inviteData.tier)
          .single();

        if (limitsError) throw limitsError;
        setLimits(limitsData);

        return;
      }

      // Sinon, utiliser le système d'abonnement normal
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (subError && subError.code !== 'PGRST116') {
        throw subError;
      }

      // Si pas d'abonnement, créer un trial calmini
      let userSubscription = subData;
      if (!userSubscription) {
        const { data: newSub, error: createError } = await supabase
          .from('user_subscriptions')
          .insert({
            user_id: user.id,
            tier: 'calmini',
            status: 'trial',
            current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          })
          .select()
          .single();

        if (createError) throw createError;
        userSubscription = newSub;
      }

      setSubscription(userSubscription);

      // Récupérer les limites pour ce tier
      const { data: limitsData, error: limitsError } = await supabase
        .from('subscription_limits')
        .select('*')
        .eq('tier', userSubscription.tier)
        .single();

      if (limitsError) throw limitsError;
      setLimits(limitsData);

    } catch (err: any) {
      console.error('Error fetching subscription:', err);
      setError(err.message);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les informations d'abonnement",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSubscription = () => {
    fetchSubscription();
  };

  useEffect(() => {
    fetchSubscription();
  }, [user, isBetaActive, betaInfo]);

  return {
    subscription,
    limits,
    loading,
    error,
    refreshSubscription
  };
};