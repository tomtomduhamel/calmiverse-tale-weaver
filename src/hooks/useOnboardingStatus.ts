import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface State {
  loading: boolean;
  completed: boolean | null;
}

export function useOnboardingStatus() {
  const { user } = useSupabaseAuth();
  const [state, setState] = useState<State>({ loading: true, completed: null });

  const refresh = useCallback(async () => {
    if (!user) {
      setState({ loading: false, completed: null });
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('onboarding_completed')
      .eq('id', user.id)
      .maybeSingle();
    if (error) {
      console.warn('[useOnboardingStatus] error', error);
      setState({ loading: false, completed: true }); // fail open — don't trap users
      return;
    }
    setState({ loading: false, completed: Boolean(data?.onboarding_completed) });
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const markCompleted = useCallback(async () => {
    if (!user) return;
    setState((s) => ({ ...s, completed: true }));
    await supabase.from('users').update({ onboarding_completed: true }).eq('id', user.id);
  }, [user]);

  return { ...state, refresh, markCompleted };
}
