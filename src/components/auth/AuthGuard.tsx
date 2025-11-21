import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';
import { shouldUseFastBoot, isPreviewMode } from '@/utils/mobileBootOptimizer';
import { bootMonitor } from '@/utils/bootMonitor';
import { PreviewAuthBanner } from '@/components/PreviewAuthBanner';

interface AuthGuardProps {
  children: React.ReactNode;
  previewMode?: boolean;
}

/**
 * 🔐 GARDE D'AUTHENTIFICATION CENTRALISÉE - TURBO MOBILE + PREVIEW
 * 
 * Mode Desktop (strict) :
 * - Affiche immédiatement le contenu si l'utilisateur est déjà chargé
 * - Montre un loader uniquement si loading = true ET pas encore d'utilisateur
 * - Redirige vers /auth uniquement après timeout si pas d'utilisateur
 * 
 * Mode Preview Mobile (tolérant avec authentification) :
 * - Timeout augmenté à 45s pour localStorage dans iframe
 * - Affiche TOUJOURS le contenu immédiatement (pas d'écran blanc)
 * - Ne redirige JAMAIS vers /auth automatiquement
 * - Banner informative montrant l'état d'authentification
 * - Tentative d'auth en arrière-plan
 * - Fallback gracieux vers contenu visible si auth échoue
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children, previewMode: previewModeProp }) => {
  const { user, loading, timeoutReached } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [authBannerStatus, setAuthBannerStatus] = useState<'loading' | 'authenticated' | 'demo'>('loading');
  
  // Détection du mode preview (passé en prop ou auto-détecté)
  const previewMode = previewModeProp !== undefined ? previewModeProp : isPreviewMode();
  const fastBootMode = shouldUseFastBoot();

  // Gestion de l'état du banner en fonction de l'authentification
  useEffect(() => {
    if (previewMode) {
      if (user) {
        setAuthBannerStatus('authenticated');
      } else if (loading && !timeoutReached) {
        setAuthBannerStatus('loading');
      } else {
        setAuthBannerStatus('demo');
      }
    }
  }, [user, loading, timeoutReached, previewMode]);

  useEffect(() => {
    console.log('[AuthGuard] Check auth state', { 
      user: !!user, 
      loading, 
      timeoutReached, 
      previewMode,
      fastBootMode 
    });
    bootMonitor.log(`AuthGuard: Check - User:${!!user} Loading:${loading} Timeout:${timeoutReached} Preview:${previewMode} FastBoot:${fastBootMode}`);
    
    // MODE PREVIEW : Tolérance maximale, pas de redirection automatique
    if (previewMode) {
      console.log('[AuthGuard] 🎭 Preview mode - affichage contenu immédiat avec banner');
      bootMonitor.log('AuthGuard: Preview mode activated - no auto redirect');
      // En mode preview, on n'effectue JAMAIS de redirection automatique
      // L'utilisateur peut cliquer sur "Se connecter" dans le banner s'il le souhaite
      return;
    }
    
    // MODE MOBILE NON-PREVIEW : Tolérance mais avec fallback redirection
    if (fastBootMode && !previewMode) {
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
  }, [user, loading, timeoutReached, navigate, location, previewMode, fastBootMode]);

  // MODE PREVIEW : Affichage immédiat avec banner d'état
  if (previewMode) {
    bootMonitor.log('AuthGuard: Preview mode - render with auth banner');
    return (
      <>
        <PreviewAuthBanner 
          status={authBannerStatus}
          userEmail={user?.email}
        />
        {children}
      </>
    );
  }

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
