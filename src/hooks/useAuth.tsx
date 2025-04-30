
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Hook de compatibilité pour faciliter la migration de Firebase Auth vers Supabase Auth
 * Utilise prioritairement Supabase si disponible, sinon utilise Firebase Auth
 */
export const useAuth = () => {
  const supabaseAuth = useSupabaseAuth();
  const [firebaseUser, setFirebaseUser] = useState(auth.currentUser);
  const [loading, setLoading] = useState(true);
  const [isUsingFirebase, setIsUsingFirebase] = useState(false);

  // Écouter les changements d'authentification Firebase (pour compatibilité)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (!supabaseAuth.user && user) {
        setIsUsingFirebase(true);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [supabaseAuth.user]);

  // Utiliser prioritairement Supabase, sinon Firebase
  const user = supabaseAuth.user || firebaseUser;
  const authLoading = supabaseAuth.loading || loading;

  if (isUsingFirebase && firebaseUser) {
    console.warn(
      "Vous utilisez encore Firebase Auth au lieu de Supabase Auth.\n" +
      "Veuillez migrer votre authentification vers Supabase pour bénéficier de toutes les fonctionnalités."
    );
  }

  return {
    user,
    loading: authLoading,
    signIn: supabaseAuth.signInWithEmail,
    signUp: supabaseAuth.signUpWithEmail,
    signInWithGoogle: supabaseAuth.signInWithGoogle,
    logout: supabaseAuth.logout
  };
};

export default useAuth;
