import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  GoogleAuthProvider, 
  signInWithPopup, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

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
  switch (error.code) {
    case 'auth/unauthorized-domain':
      return "Ce domaine n'est pas autorisé pour l'authentification. Veuillez réessayer plus tard.";
    case 'auth/invalid-login-credentials':
      return "Email ou mot de passe incorrect";
    case 'auth/user-not-found':
      return "Aucun compte ne correspond à cet email";
    case 'auth/wrong-password':
      return "Mot de passe incorrect";
    case 'auth/email-already-in-use':
      return "Un compte existe déjà avec cet email";
    case 'auth/weak-password':
      return "Le mot de passe doit contenir au moins 6 caractères";
    case 'auth/network-request-failed':
      return "Problème de connexion réseau. Veuillez réessayer.";
    case 'auth/popup-closed-by-user':
      return "La fenêtre de connexion a été fermée. Veuillez réessayer.";
    case 'auth/cancelled-popup-request':
      return "Une seule fenêtre de connexion peut être ouverte à la fois.";
    case 'auth/popup-blocked':
      return "La fenêtre de connexion a été bloquée par votre navigateur.";
    default:
      return "Une erreur est survenue. Veuillez réessayer.";
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue sur Calmi !",
      });
    } catch (error: any) {
      console.error('Erreur de connexion Google:', error);
      toast({
        title: "Erreur de connexion",
        description: getAuthErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
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
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
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