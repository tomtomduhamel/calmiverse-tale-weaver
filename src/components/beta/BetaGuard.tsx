import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';
import { useBetaRegistrationAttempt } from '@/hooks/beta/useBetaRegistrationAttempt';
import { Card } from '@/components/ui/card';

interface BetaGuardProps {
  children: React.ReactNode;
}

/**
 * BetaGuard - Protège les routes en vérifiant le statut beta de l'utilisateur
 * 
 * Redirige vers :
 * - /auth si l'utilisateur n'est pas connecté
 * - /beta-pending si le beta user est en attente de validation, rejeté, ou a une tentative d'inscription en cours
 * - Laisse passer si l'utilisateur est un beta user actif ou n'est pas un beta user (et n'a pas de tentative en cours)
 */
const BetaGuard: React.FC<BetaGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { betaInfo, loading: betaLoading, isPending, isRejected, isExpired } = useBetaStatus();
  const { hasPendingAttempt, loading: attemptLoading } = useBetaRegistrationAttempt();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne pas vérifier tant que le chargement n'est pas terminé
    if (authLoading || betaLoading || attemptLoading) return;

    // Rediriger vers /auth si non connecté
    if (!user) {
      console.log('[BetaGuard] User not authenticated, redirecting to /auth');
      navigate('/auth', { replace: true });
      return;
    }

    // SÉCURITÉ CRITIQUE: Si l'utilisateur a une tentative d'inscription beta en attente 
    // mais n'est pas encore enregistré comme beta user, bloquer l'accès
    // Cela empêche quelqu'un qui a créé un compte avec un code d'invitation 
    // d'accéder à l'application avant validation admin
    if (hasPendingAttempt && !betaInfo) {
      console.log('[BetaGuard] User has pending beta registration attempt but not registered as beta user yet');
      console.log('[BetaGuard] Blocking access and redirecting to /beta-pending');
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Si l'utilisateur est un beta user avec un statut qui bloque l'accès
    if (betaInfo && (isPending || isRejected || isExpired)) {
      console.log('[BetaGuard] Beta user with blocked status, redirecting to /beta-pending');
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Sinon, laisser passer (beta actif ou non-beta user sans tentative en cours)
    console.log('[BetaGuard] Access granted', { 
      isBeta: !!betaInfo, 
      isActive: betaInfo?.status === 'active',
      hasPendingAttempt
    });
  }, [user, betaInfo, isPending, isRejected, isExpired, hasPendingAttempt, authLoading, betaLoading, attemptLoading, navigate, location.pathname]);

  // Afficher un loader pendant la vérification
  if (authLoading || betaLoading || attemptLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-6 max-w-md w-full">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            <p className="text-muted-foreground">Vérification de votre accès...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Si non authentifié, statut bloqué, ou tentative en attente, ne rien afficher (la redirection se fera)
  if (!user || (betaInfo && (isPending || isRejected || isExpired)) || (hasPendingAttempt && !betaInfo)) {
    return null;
  }

  // Accès accordé
  return <>{children}</>;
};

export default BetaGuard;
