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
  signUpWithEmail: (email: string, password: string, inviteCode?: string | null) => Promise<void>;
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
      await authSignInWithEmail(email, password);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur de connexion');
      setError(errorMessage);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string, inviteCode?: string | null) => {
    try {
      setError(null);
      await authSignUpWithEmail(email, password, inviteCode);
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur d\'inscription');
      setError(errorMessage);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      await authSignInWithGoogle();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur de connexion Google');
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authLogout();
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'string' ? err : 'Erreur de déconnexion');
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