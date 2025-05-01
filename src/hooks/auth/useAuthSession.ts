
import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("Initialisation de l'authentification Supabase");
    
    // 1. D'abord configurer le listener d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('Changement d\'état d\'authentification:', event, currentSession?.user?.id);
      
      if (currentSession) {
        console.log('Session trouvée:', currentSession.user.id);
        setSession(currentSession);
        setUser(currentSession.user);
      } else {
        console.log('Aucune session trouvée');
        setSession(null);
        setUser(null);
      }
      
      setLoading(false);
    });

    // 2. Ensuite vérifier la session existante
    console.log("Vérification de la session existante");
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('Session existante:', currentSession?.user?.id);
      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
      }
      setLoading(false);
    }).catch(err => {
      console.error('Erreur lors de la récupération de la session:', err);
      setLoading(false);
    });

    return () => {
      console.log("Nettoyage du listener d'authentification");
      subscription.unsubscribe();
    };
  }, []);

  // Exposer des informations de débogage dans la console
  useEffect(() => {
    console.log("État d'authentification mis à jour - Utilisateur:", user?.id, "Chargement:", loading);
  }, [user, loading]);

  return {
    user,
    session,
    loading
  };
};
