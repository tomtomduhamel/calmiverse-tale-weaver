import React, { useState, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { useAuthSession } from '@/hooks/auth/useAuthSession';
import { useAuthOperations } from '@/hooks/auth/useAuthOperations';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null; // Changed from AuthError to string for consistency
  timeoutReached: boolean;
  retryAuth: () => void;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [error, setError] = useState<string | null>(null);
  const { user, session, loading, error: sessionError, timeoutReached, retryAuth } = useAuthSession();
  const { signInWithEmail: authSignInWithEmail, 
          signUpWithEmail: authSignUpWithEmail, 
          signInWithGoogle: authSignInWithGoogle, 
          logout: authLogout } = useAuthOperations();

  // Convert session error to string and merge with local error
  const combinedError = error || sessionError || null;

  // Wrapper pour les fonctions d'authentification qui gère les erreurs dans le contexte
  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      console.log("[SupabaseAuthContext] Tentative de connexion pour:", email);
      await authSignInWithEmail(email, password);
      console.log("[SupabaseAuthContext] Connexion réussie");
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur de connexion');
      console.error("[SupabaseAuthContext] Erreur de connexion:", errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      console.log("[SupabaseAuthContext] Tentative d'inscription pour:", email);
      await authSignUpWithEmail(email, password);
      console.log("[SupabaseAuthContext] Inscription réussie");
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur d\'inscription');
      console.error("[SupabaseAuthContext] Erreur d'inscription:", errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      console.log("[SupabaseAuthContext] Tentative de connexion Google");
      await authSignInWithGoogle();
      console.log("[SupabaseAuthContext] Connexion Google réussie");
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur de connexion Google');
      console.error("[SupabaseAuthContext] Erreur de connexion Google:", errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      console.log("[SupabaseAuthContext] Tentative de déconnexion");
      await authLogout();
      console.log("[SupabaseAuthContext] Déconnexion réussie");
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur de déconnexion');
      console.error("[SupabaseAuthContext] Erreur de déconnexion:", errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{
      user,
      session,
      loading,
      error: combinedError,
      timeoutReached,
      retryAuth,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      logout
    }}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth doit être utilisé à l\'intérieur d\'un SupabaseAuthProvider');
  }
  return context;
};