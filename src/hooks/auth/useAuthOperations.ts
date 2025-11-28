
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
      
      // Si code d'invitation beta, enregistrer la demande
      if (inviteCode && data.user) {
        console.log("[Auth] Registering beta request for user:", data.user.id);
        
        try {
          const { data: betaData, error: betaError } = await supabase.rpc('register_beta_request', {
            p_user_id: data.user.id,
            p_email: email,
            p_code: inviteCode
          });
          
          if (betaError) {
            console.error("[Auth] Error registering beta request:", betaError);
            toast({
              title: "Attention",
              description: "Votre compte a été créé mais la demande beta a échoué. Contactez le support.",
              variant: "destructive",
            });
          } else {
            console.log("[Auth] Beta request registered:", betaData);
            toast({
              title: "Demande beta enregistrée",
              description: "Votre compte est en attente de validation par notre équipe.",
            });
          }
        } catch (betaErr: any) {
          console.error("[Auth] Beta registration failed:", betaErr);
        }
      } else {
        toast({
          title: "Inscription réussie",
          description: "Bienvenue sur Calmi ! Veuillez vérifier votre boîte mail pour confirmer votre compte.",
        });
      }
      
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
