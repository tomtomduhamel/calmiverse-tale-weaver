
import React, { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { shouldUseFastBoot } from '@/utils/mobileBootOptimizer';
import { bootMonitor } from '@/utils/bootMonitor';

export const useAuthSession = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeoutReached, setTimeoutReached] = useState(false);

  useEffect(() => {
    bootMonitor.log('useAuthSession: Init');
    
    // MOBILE BOOT TURBO: Timeout adaptatif selon contexte
    const timeoutDuration = shouldUseFastBoot() ? 30000 : 8000; // 30s mobile iframe, 8s desktop
    const bootMode = shouldUseFastBoot() ? 'MOBILE IFRAME' : 'DESKTOP';
    
    console.log(`[Auth] Initialisation avec timeout ${timeoutDuration/1000}s (Mode: ${bootMode})`);
    
    const authTimeout = setTimeout(() => {
      if (loading) {
        console.warn(`⚠️ Timeout d'authentification atteint (${timeoutDuration/1000}s) - Mode: ${bootMode}`);
        bootMonitor.log(`Auth timeout reached (${timeoutDuration/1000}s)`);
        setLoading(false);
        setTimeoutReached(true);
        setError("Délai d'attente dépassé - veuillez réessayer");
      }
    }, timeoutDuration);

    const cleanup = () => {
      clearTimeout(authTimeout);
    };
    console.log("Initialisation sécurisée de l'authentification Supabase");
    
    // 1. Configurer le listener d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      console.log('[Auth] Changement d\'état:', event, currentSession?.user?.id || 'Déconnecté');
      bootMonitor.log(`Auth state change: ${event}`);
      
      try {
        if (currentSession) {
          // Validation de sécurité de la session
          const now = Math.floor(Date.now() / 1000);
          if (currentSession.expires_at && currentSession.expires_at < now) {
            console.warn('[Auth] Session expirée détectée');
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setError('Session expirée');
            return;
          }
          
          console.log('[Auth] ✅ Session valide:', currentSession.user.id);
          bootMonitor.log('Auth: Session valide trouvée');
          setSession(currentSession);
          setUser(currentSession.user);
          setError(null);
        } else {
          console.log('[Auth] Aucune session trouvée');
          setSession(null);
          setUser(null);
          setError(null);
        }
      } catch (err) {
        console.error('[Auth] Erreur traitement état:', err);
        setError('Erreur d\'authentification');
        setSession(null);
        setUser(null);
      } finally {
        setLoading(false);
        bootMonitor.log('Auth: Loading terminé');
      }
    });

    // 2. Vérifier la session existante avec gestion d'erreur
    const checkExistingSession = async () => {
      try {
        bootMonitor.log('Auth: Vérification session existante');
        console.log("[Auth] Vérification session existante");
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
      cleanup();
      subscription.unsubscribe();
    };
  }, []);

  // Log sécurisé des changements d'état
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log("État d'authentification mis à jour - Utilisateur:", user?.id || 'Aucun', "Chargement:", loading, "Erreur:", error || 'Aucune');
    }
  }, [user, loading, error]);

  // Fonction de retry pour l'utilisateur
  const retryAuth = useCallback(() => {
    setLoading(true);
    setError(null);
    setTimeoutReached(false);
    
    // Relancer la vérification de session
    supabase.auth.getSession().then(({ data: { session: currentSession }, error }) => {
      if (error) {
        setError('Erreur de session');
        setLoading(false);
      } else if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user);
        setError(null);
        setLoading(false);
      } else {
        setLoading(false);
      }
    }).catch((err) => {
      console.error('Erreur retry auth:', err);
      setError('Erreur de reconnexion');
      setLoading(false);
    });
  }, []);

  return {
    user,
    session,
    loading,
    error,
    timeoutReached,
    retryAuth
  };
};
