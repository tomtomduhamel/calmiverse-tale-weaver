import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

interface BetaInvitationStatus {
  isValid: boolean;
  code: string | null;
  loading: boolean;
  error: string | null;
}

export const useBetaInvitation = () => {
  const { user } = useSupabaseAuth();
  const [status, setStatus] = useState<BetaInvitationStatus>({
    isValid: false,
    code: null,
    loading: false,
    error: null
  });

  /**
   * Vérifie si un code d'invitation est valide
   */
  const checkInvitationCode = async (code: string): Promise<boolean> => {
    try {
      setStatus(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase
        .from('beta_invitations')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        setStatus({
          isValid: false,
          code: null,
          loading: false,
          error: 'Code d\'invitation invalide ou expiré'
        });
        return false;
      }

      // Vérifier l'expiration
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setStatus({
          isValid: false,
          code: null,
          loading: false,
          error: 'Code d\'invitation expiré'
        });
        return false;
      }

      // Vérifier le nombre max d'utilisations
      if (data.max_uses !== null && data.current_uses >= data.max_uses) {
        setStatus({
          isValid: false,
          code: null,
          loading: false,
          error: 'Code d\'invitation déjà utilisé le nombre maximum de fois'
        });
        return false;
      }

      setStatus({
        isValid: true,
        code: code,
        loading: false,
        error: null
      });
      return true;
    } catch (err: any) {
      console.error('Error checking invitation code:', err);
      setStatus({
        isValid: false,
        code: null,
        loading: false,
        error: 'Erreur lors de la vérification du code'
      });
      return false;
    }
  };

  /**
   * Enregistre une demande de beta testeur
   */
  const registerBetaRequest = async (email: string, inviteCode: string) => {
    try {
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      console.log('[Beta] Registering beta request for:', email, 'with code:', inviteCode);

      const { data, error } = await supabase.rpc('register_beta_request', {
        p_user_id: user.id,
        p_email: email,
        p_code: inviteCode
      });

      if (error) {
        console.error('[Beta] Error registering beta request:', error);
        throw error;
      }

      console.log('[Beta] Beta request registered:', data);
      return data;
    } catch (err: any) {
      console.error('[Beta] Failed to register beta request:', err);
      throw err;
    }
  };

  /**
   * Récupère le code d'invitation depuis sessionStorage
   */
  const getStoredInviteCode = (): string | null => {
    return sessionStorage.getItem('beta_invite_code');
  };

  /**
   * Stocke le code d'invitation dans sessionStorage
   */
  const storeInviteCode = (code: string) => {
    sessionStorage.setItem('beta_invite_code', code);
  };

  /**
   * Nettoie le code d'invitation du sessionStorage
   */
  const clearInviteCode = () => {
    sessionStorage.removeItem('beta_invite_code');
  };

  return {
    status,
    checkInvitationCode,
    registerBetaRequest,
    getStoredInviteCode,
    storeInviteCode,
    clearInviteCode
  };
};
