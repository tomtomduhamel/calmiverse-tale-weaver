
import { useCallback } from 'react';
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

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    try {
      console.log("Tentative d'inscription avec email:", email);
      const { data, error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        throw handleAuthError(error, "Erreur d'inscription");
      }
      
      console.log("Inscription réussie");
      
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Calmi ! Veuillez vérifier votre boîte mail pour confirmer votre compte.",
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
