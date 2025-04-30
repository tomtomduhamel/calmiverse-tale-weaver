
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité.
 * Utiliser SupabaseAuthContext à la place.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getAuthErrorMessage = (error: AuthError) => {
  switch (error.message) {
    case 'Invalid login credentials':
      return "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
    case 'User not found':
      return "Aucun compte ne correspond à cet email. Veuillez vous inscrire.";
    case 'Wrong password':
      return "Mot de passe incorrect. Veuillez réessayer.";
    case 'User already exists':
    case 'Email already registered':
      return "Un compte existe déjà avec cet email. Veuillez vous connecter.";
    case 'Password too short':
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case 'Network error':
      return "Problème de connexion réseau. Veuillez vérifier votre connexion et réessayer.";
    case 'Rate limit exceeded':
      return "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
    case 'Auth session missing':
      return "Session expirée. Veuillez vous reconnecter.";
    default:
      console.error('Supabase Auth Error:', error);
      return "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    // Récupérer l'utilisateur courant au chargement
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google'
      });
      
      if (error) throw error;
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Calmi !",
      });
    } catch (error: any) {
      console.error('Erreur de connexion Google:', error);
      toast({
        title: "Erreur de connexion",
        description: getAuthErrorMessage(error as AuthError),
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Calmi !",
      });
    } catch (error: any) {
      console.error('Erreur de connexion email:', error);
      toast({
        title: "Erreur de connexion",
        description: getAuthErrorMessage(error as AuthError),
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Calmi !",
      });
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      toast({
        title: "Erreur d'inscription",
        description: getAuthErrorMessage(error as AuthError),
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error: any) {
      console.error('Erreur de déconnexion:', error);
      toast({
        title: "Erreur",
        description: getAuthErrorMessage(error as AuthError),
        variant: "destructive",
      });
    }
  };

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

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
