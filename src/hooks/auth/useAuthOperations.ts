
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
      
      console.log("Inscription réussie");

      // Créer immédiatement une entrée beta_users avec statut pending_validation
      // pour TOUS les nouveaux utilisateurs — aucun accès sans validation admin
      if (data.user) {
        try {
          const { error: betaError } = await supabase.from('beta_users').insert({
            user_id: data.user.id,
            email: email,
            invitation_code: inviteCode || null, // null pour les users normaux
            status: 'pending_validation'
          });

          if (betaError) {
            // La contrainte unique peut être déclenchée si l'utilisateur existe déjà
            if (betaError.code !== '23505') {
              console.error("[Auth] Erreur création beta_users:", betaError);
            } else {
              console.log("[Auth] beta_users déjà existant pour cet utilisateur");
            }
          } else {
            console.log("[Auth] Entrée beta_users créée avec statut pending_validation");
          }
        } catch (betaInsertErr) {
          console.error("[Auth] Échec création beta_users (non bloquant):", betaInsertErr);
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
