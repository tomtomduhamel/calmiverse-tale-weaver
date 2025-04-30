
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { Session, User, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const SupabaseAuthContext = createContext<AuthContextType | null>(null);

const getAuthErrorMessage = (error: AuthError) => {
  switch (error.message) {
    case 'Invalid login credentials':
      return "Email ou mot de passe incorrect. Veuillez vérifier vos identifiants.";
    case 'User not found':
      return "Aucun compte ne correspond à cet email. Veuillez vous inscrire.";
    case 'Email already in use':
      return "Un compte existe déjà avec cet email. Veuillez vous connecter.";
    case 'Password should be at least 6 characters':
      return "Le mot de passe doit contenir au moins 6 caractères.";
    case 'Network request failed':
      return "Problème de connexion réseau. Veuillez vérifier votre connexion et réessayer.";
    case 'Too many requests':
      return "Trop de tentatives de connexion. Veuillez réessayer plus tard.";
    default:
      console.error('Erreur d\'authentification Supabase:', error);
      return "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
  }
};

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Récupérer la session actuelle au chargement
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Calmi !",
      });
    } catch (error: any) {
      console.error('Erreur de connexion email:', error);
      toast({
        title: "Erreur de connexion",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
      
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Calmi !",
      });
    } catch (error: any) {
      console.error('Erreur d\'inscription:', error);
      toast({
        title: "Erreur d'inscription",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) throw error;
      
      // Le toast sera affiché après la redirection
    } catch (error: any) {
      console.error('Erreur de connexion Google:', error);
      toast({
        title: "Erreur de connexion",
        description: getAuthErrorMessage(error),
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
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{
      user,
      session,
      loading,
      signInWithEmail,
      signUpWithEmail,
      signInWithGoogle,
      logout
    }}>
      {!loading && children}
    </SupabaseAuthContext.Provider>
  );
};

export const useSupabaseAuth = () => {
  const context = useContext(SupabaseAuthContext);
  if (!context) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};
