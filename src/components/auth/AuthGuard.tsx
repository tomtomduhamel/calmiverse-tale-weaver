import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { shouldUseFastBoot } from '@/utils/mobileBootOptimizer';
import { bootMonitor } from '@/utils/bootMonitor';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 🔐 GARDE D'AUTHENTIFICATION STANDARD
 * 
 * Mode Desktop/Mobile (strict) :
 * - Affiche immédiatement le contenu si l'utilisateur est déjà chargé
 * - Montre un loader uniquement si loading = true ET pas encore d'utilisateur
 * - Redirige vers /auth si pas d'utilisateur après timeout
 * 
 * Note: En mode preview mobile, ce composant est complètement bypassé dans Shell.tsx
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, timeoutReached } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fastBootMode = shouldUseFastBoot();

  useEffect(() => {
    console.log('[AuthGuard] Check auth state', { 
      user: !!user, 
      loading, 
      timeoutReached,
      fastBootMode 
    });
    bootMonitor.log(`AuthGuard: Check - User:${!!user} Loading:${loading} Timeout:${timeoutReached} FastBoot:${fastBootMode}`);
    
    // MODE MOBILE : Tolérance mais avec fallback redirection
    if (fastBootMode) {
      if (!loading && !user && timeoutReached) {
        console.log('[AuthGuard] 🚀 Mobile mode - timeout définitif, redirection vers /auth');
        bootMonitor.log('AuthGuard: Final timeout, redirecting to /auth (mobile)');
        navigate('/auth', { state: { from: location.pathname } });
      }
      return;
    }
    
    // MODE DESKTOP : Comportement strict standard
    if ((!loading && !user) || (timeoutReached && !user)) {
      console.log('[AuthGuard] 🖥️ Desktop mode - redirection vers /auth');
      bootMonitor.log('AuthGuard: Redirecting to /auth (desktop)');
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [user, loading, timeoutReached, navigate, location, fastBootMode]);

  // Affichage optimiste : si on a un user, on affiche immédiatement
  if (user) {
    bootMonitor.log('AuthGuard: User authenticated, render children');
    return <>{children}</>;
  }

  // Si loading ET pas encore de user, afficher un loader minimal
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            {fastBootMode ? 'Chargement mobile (cela peut prendre jusqu\'à 45s)...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  // Si pas de user après chargement, afficher loader pendant redirection
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="text-sm text-muted-foreground">Redirection...</p>
      </div>
    </div>
  );
};
