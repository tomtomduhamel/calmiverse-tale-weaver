
import React, { useCallback } from 'react';
import { AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { getAuthErrorMessage } from '@/utils/auth/authErrorMessages';

export const useAuthOperations = () => {
  const { toast } = useToast();

  const handleAuthError = useCallback((error: AuthError, title: string) => {
    console.error(title, error);
    toast({
      title,
      description: getAuthErrorMessage(error),
      variant: "destructive",
    });
    return error;
  }, [toast]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    try {
      console.log("Tentative de connexion avec email:", email);
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw handleAuthError(error, "Erreur de connexion");
      }

      console.log("Connexion réussie, session:", data.session?.user.id);
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Calmi !",
      });
      
      return data;
    } catch (err: any) {
      console.error('Erreur de connexion email:', err);
      throw err;
    }
  }, [toast, handleAuthError]);

  const signUpWithEmail = useCallback(async (email: string, password: string, inviteCode?: string | null) => {
    try {
      console.log("Tentative d'inscription avec email:", email, inviteCode ? "avec code beta" : "");
      
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`
        }
      });
      
      if (error) {
        throw handleAuthError(error, "Erreur d'inscription");
      }
      
      console.log("Inscription réussie:", data.user?.id);

      // Créer l'entrée beta_users via RPC (SECURITY DEFINER bypass RLS)
      // Fonctionne en local et en production sans déploiement d'Edge Function
      if (data.user) {
        try {
          const { data: rpcData, error: rpcError } = await supabase.rpc('create_pending_beta_user', {
            p_user_id: data.user.id,
            p_email: email,
            p_invitation_code: inviteCode || 'DIRECT', // 'DIRECT' = inscription sans code (NOT NULL constraint)
          });

          if (rpcError) {
            console.error("[Auth] Erreur RPC create_pending_beta_user:", rpcError);
          } else {
            console.log("[Auth] ✅ Entrée beta_users créée via RPC:", rpcData);
          }
        } catch (rpcErr) {
          console.error("[Auth] Échec appel RPC (non bloquant):", rpcErr);
        }
      }

      toast({
        title: "Inscription réussie",
        description: "Votre demande est en attente de validation. Vous serez notifié dès que votre accès sera activé.",
      });
      
      return data;
    } catch (err: any) {
      console.error('Erreur d\'inscription:', err);
      throw err;
    }
  }, [toast, handleAuthError]);


  const signInWithGoogle = useCallback(async () => {
    try {
      console.log('Tentative de connexion avec Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      console.log('Résultat de la tentative de connexion Google:', { data, error });
      
      if (error) {
        throw handleAuthError(error, "Erreur de connexion");
      }
      
      return data;
    } catch (err: any) {
      console.error('Erreur de connexion Google:', err);
      throw err;
    }
  }, [handleAuthError]);

  const logout = useCallback(async () => {
    try {
      console.log("Tentative de déconnexion");
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw handleAuthError(error, "Erreur de déconnexion");
      }
      
      console.log("Déconnexion réussie");
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (err: any) {
      console.error('Erreur de déconnexion:', err);
      throw err;
    }
  }, [toast, handleAuthError]);

  return {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout
  };
};
