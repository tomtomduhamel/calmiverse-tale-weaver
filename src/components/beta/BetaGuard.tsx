import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';
import { Card } from '@/components/ui/card';

interface BetaGuardProps {
  children: React.ReactNode;
}

/**
 * BetaGuard - Protège les routes en vérifiant le statut de l'utilisateur
 * 
 * Redirige vers :
 * - /auth si l'utilisateur n'est pas connecté
 * - /beta-pending si l'utilisateur est en attente de validation, rejeté, ou expiré
 * - Laisse passer si l'utilisateur est un beta user actif
 * 
 * Tous les nouveaux inscrits reçoivent un statut `pending_validation` 
 * dans la table beta_users — aucun accès sans validation admin.
 */
const BetaGuard: React.FC<BetaGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { betaInfo, loading: betaLoading, isPending, isRejected, isExpired } = useBetaStatus();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Ne pas vérifier tant que le chargement n'est pas terminé
    if (authLoading || betaLoading) return;

    // Rediriger vers /auth si non connecté
    if (!user) {
      console.log('[BetaGuard] User not authenticated, redirecting to /auth');
      navigate('/auth', { replace: true });
      return;
    }

    // Bloquer les utilisateurs en attente de validation, rejetés, ou expirés
    if (betaInfo && (isPending || isRejected || isExpired)) {
      console.log('[BetaGuard] Beta user with blocked status:', betaInfo.status);
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Bloquer les utilisateurs sans betaInfo (compte créé mais pas encore validé)
    // Cas possible si l'insertion en base a été retardée
    if (!betaInfo && user) {
      console.log('[BetaGuard] No betaInfo found for user, redirecting to /beta-pending');
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Accès accordé : beta user actif
    console.log('[BetaGuard] Access granted', { 
      isBeta: !!betaInfo, 
      isActive: betaInfo?.status === 'active',
    });
  }, [user, betaInfo, isPending, isRejected, isExpired, authLoading, betaLoading, navigate, location.pathname]);

  // Afficher un loader pendant la vérification
  if (authLoading || betaLoading) {
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

  // Si non authentifié ou statut bloqué, ne rien afficher (redirection en cours)
  if (!user || !betaInfo || (betaInfo && (isPending || isRejected || isExpired))) {
    return null;
  }

  // Accès accordé
  return <>{children}</>;
};

export default BetaGuard;
