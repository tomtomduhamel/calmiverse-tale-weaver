
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("Initialisation sécurisée de l'authentification Supabase");
    
    // 1. Configurer le listener d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('Changement d\'état d\'authentification:', event, currentSession?.user?.id || 'Déconnecté');
      
      try {
        if (currentSession) {
          // Validation de sécurité de la session
          const now = Math.floor(Date.now() / 1000);
          if (currentSession.expires_at && currentSession.expires_at < now) {
            console.warn('Session expirée détectée');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setError('Session expirée');
            return;
          }
          
          console.log('Session valide trouvée:', currentSession.user.id);
          setSession(currentSession);
          setUser(currentSession.user);
          setError(null);
        } else {
          console.log('Aucune session trouvée');
          setSession(null);
          setUser(null);
          setError(null);
        }
      } catch (err) {
        console.error('Erreur lors du traitement de l\'état d\'authentification:', err);
        setError('Erreur d\'authentification');
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    // 2. Vérifier la session existante avec gestion d'erreur
    const checkExistingSession = async () => {
      try {
        console.log("Vérification sécurisée de la session existante");
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erreur lors de la récupération de la session:', error);
          setError('Erreur de session');
          setLoading(false);
          return;
        }
        
        if (currentSession) {
          // Validation de sécurité
          const now = Math.floor(Date.now() / 1000);
          if (currentSession.expires_at && currentSession.expires_at < now) {
            console.warn('Session existante expirée');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setError('Session expirée');
          } else {
            console.log('Session existante valide:', currentSession.user.id);
            setSession(currentSession);
            setUser(currentSession.user);
            setError(null);
          }
        } else {
          console.log('Aucune session existante');
        }
      } catch (err) {
        console.error('Erreur lors de la vérification de la session:', err);
        setError('Erreur de vérification de session');
      } finally {
        setLoading(false);
      }
    };

    checkExistingSession();

    return () => {
      console.log("Nettoyage sécurisé du listener d'authentification");
      subscription.unsubscribe();
    };
  }, []);

  // Log sécurisé des changements d'état
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("État d'authentification mis à jour - Utilisateur:", user?.id || 'Aucun', "Chargement:", loading, "Erreur:", error || 'Aucune');
    }
  }, [user, loading, error]);

  return {
    user,
    session,
    loading,
    error
  };
};
