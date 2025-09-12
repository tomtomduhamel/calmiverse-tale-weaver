import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { UserSubscription, SubscriptionLimits } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

export const useSubscription = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = async () => {
    try {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      // Récupérer l'abonnement utilisateur
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
  }, [user]);

  return {
    subscription,
    limits,
    loading,
    error,
    refreshSubscription
  };
};