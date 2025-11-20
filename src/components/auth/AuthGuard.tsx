import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { shouldUseFastBoot } from '@/utils/mobileBootOptimizer';
import { bootMonitor } from '@/utils/bootMonitor';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 🔐 GARDE D'AUTHENTIFICATION CENTRALISÉE - TURBO MOBILE
 * 
 * Mode Desktop (strict) :
 * - Affiche immédiatement le contenu si l'utilisateur est déjà chargé
 * - Montre un loader uniquement si loading = true ET pas encore d'utilisateur
 * - Redirige vers /auth uniquement après timeout si pas d'utilisateur
 * 
 * Mode Mobile Iframe (tolérant) :
 * - Timeout plus long (30s)
 * - Pas de redirection immédiate
 * - Affiche contenu avec banner "Connexion en cours" si timeout atteint
 * - Permet navigation même sans auth complète
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, timeoutReached } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showOfflineMode, setShowOfflineMode] = useState(false);
  const fastBootMode = shouldUseFastBoot();

  useEffect(() => {
    console.log('[AuthGuard] Check auth state', { 
      user: !!user, 
      loading, 
      timeoutReached, 
      fastBootMode 
    });
    bootMonitor.log(`AuthGuard: Check - User:${!!user} Loading:${loading} Timeout:${timeoutReached} FastBoot:${fastBootMode}`);
    
    // MODE MOBILE IFRAME : Tolérance maximale mais avec fallback redirection
    if (fastBootMode) {
      if (timeoutReached && !user) {
        console.log('[AuthGuard] 🚀 Mobile mode - activation mode hors ligne tolérant');
        bootMonitor.log('AuthGuard: Offline mode activated (mobile)');
        setShowOfflineMode(true);
        // Note: On n'empêche pas la redirection si vraiment nécessaire
        // mais on montre le contenu d'abord
      }
      // En mode mobile, on ne redirige que si vraiment pas d'espoir
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

  // MODE OFFLINE MOBILE : Afficher contenu avec banner informatif
  if (showOfflineMode && fastBootMode) {
    console.log('[AuthGuard] Rendering in offline mode with banner');
    return (
      <>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 p-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>⚠️ Connexion en cours... L'application fonctionne en mode hors ligne</span>
          </div>
        </div>
        {children}
      </>
    );
  }

  // Si loading ET pas encore de user, afficher un loader minimal
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">
            {fastBootMode ? 'Chargement mobile (cela peut prendre jusqu\'à 30s)...' : 'Chargement...'}
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
