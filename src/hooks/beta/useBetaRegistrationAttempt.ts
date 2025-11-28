import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface BetaRegistrationAttempt {
  id: string;
  email: string;
  invitation_code: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
}

/**
 * Hook pour gérer les tentatives d'inscription beta
 * Permet de tracker et vérifier si un utilisateur a une inscription beta en cours
 */
export const useBetaRegistrationAttempt = () => {
  const { user } = useSupabaseAuth();
  const [attempt, setAttempt] = useState<BetaRegistrationAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttempt = async () => {
    if (!user) {
      setAttempt(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('beta_registration_attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[BetaAttempt] Error fetching registration attempt:', error);
        setAttempt(null);
        return;
      }

      setAttempt(data as BetaRegistrationAttempt | null);
    } catch (err) {
      console.error('[BetaAttempt] Failed to fetch registration attempt:', err);
      setAttempt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempt();
  }, [user]);

  const createAttempt = async (email: string, invitationCode: string) => {
    try {
      const { data, error } = await supabase
        .from('beta_registration_attempts')
        .insert({
          email,
          invitation_code: invitationCode,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[BetaAttempt] Error creating registration attempt:', error);
        return null;
      }

      console.log('[BetaAttempt] Registration attempt created:', data.id);
      return data;
    } catch (err) {
      console.error('[BetaAttempt] Failed to create registration attempt:', err);
      return null;
    }
  };

  const updateAttemptStatus = async (attemptId: string, status: 'completed' | 'failed', userId?: string) => {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        if (userId) {
          updateData.user_id = userId;
        }
      }

      const { error } = await supabase
        .from('beta_registration_attempts')
        .update(updateData)
        .eq('id', attemptId);

      if (error) {
        console.error('[BetaAttempt] Error updating registration attempt:', error);
        return false;
      }

      console.log('[BetaAttempt] Registration attempt updated to:', status);
      return true;
    } catch (err) {
      console.error('[BetaAttempt] Failed to update registration attempt:', err);
      return false;
    }
  };

  const hasPendingAttempt = attempt?.status === 'pending';

  return {
    attempt,
    loading,
    hasPendingAttempt,
    createAttempt,
    updateAttemptStatus,
    refreshAttempt: fetchAttempt
  };
};
