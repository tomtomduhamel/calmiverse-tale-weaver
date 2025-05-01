
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité.
 * Utiliser SupabaseAuthContext à la place.
 */

import React, { createContext, useContext } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

// Création d'un contexte d'authentification compatible avec l'ancien format
const AuthContext = createContext<AuthContextType | null>(null);

// Provider qui utilise le nouveau contexte d'authentification
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    loading, 
    signInWithGoogle, 
    signInWithEmail, 
    signUpWithEmail, 
    logout 
  } = useSupabaseAuth();

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      logout
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// Hook pour utiliser le contexte d'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
