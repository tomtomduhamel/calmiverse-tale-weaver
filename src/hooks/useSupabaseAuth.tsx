
import { useState, useEffect, createContext, useContext } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface SupabaseAuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: AuthError | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const SupabaseAuthContext = createContext<SupabaseAuthContextType | null>(null);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AuthError | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Configurer le listener d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Auth state change event:', event);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    // Vérifier la session existante
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Current session:', currentSession);
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      default:
        return error.message || "Une erreur est survenue lors de la connexion. Veuillez réessayer.";
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        setError(error);
        toast({
          title: "Erreur de connexion",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Calmi !",
      });
    } catch (err: any) {
      console.error('Erreur de connexion email:', err);
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      const { error } = await supabase.auth.signUp({ email, password });
      
      if (error) {
        setError(error);
        toast({
          title: "Erreur d'inscription",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Inscription réussie",
        description: "Bienvenue sur Calmi ! Veuillez vérifier votre boîte mail pour confirmer votre compte.",
      });
    } catch (err: any) {
      console.error('Erreur d\'inscription:', err);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      console.log('Tentative de connexion avec Google...');
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      
      console.log('Résultat de la tentative de connexion Google:', { data, error });
      
      if (error) {
        setError(error);
        toast({
          title: "Erreur de connexion",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
        throw error;
      }
    } catch (err: any) {
      console.error('Erreur de connexion Google:', err);
      throw err;
    }
  };

  const logout = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error);
        toast({
          title: "Erreur de déconnexion",
          description: getAuthErrorMessage(error),
          variant: "destructive",
        });
        throw error;
      }
      
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (err: any) {
      console.error('Erreur de déconnexion:', err);
      throw err;
    }
  };

  return (
    <SupabaseAuthContext.Provider value={{
      user,
      session,
      loading,
      error,
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
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

export default useSupabaseAuth;
