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
 * - /beta-pending si :
 *   - L'utilisateur a un statut bloquant (pending, rejected, expired)
 *   - L'utilisateur n'a pas encore d'entrée dans beta_users (compte pas encore validé)
 * 
 * IMPORTANT : tous les utilisateurs existants ont été migrés vers beta_users status=active
 * via la requête SQL de migration. Seuls les nouveaux inscrits sont bloqués en attente.
 */
const BetaGuard: React.FC<BetaGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { betaInfo, loading: betaLoading, isPending, isRejected, isExpired } = useBetaStatus();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || betaLoading) return;

    // Non connecté → page de connexion
    if (!user) {
      console.log('[BetaGuard] User not authenticated, redirecting to /auth');
      navigate('/auth', { replace: true });
      return;
    }

    // Pas d'entrée beta_users → inscription en attente de validation
    if (!betaInfo) {
      console.log('[BetaGuard] No beta_users entry found, redirecting to /beta-pending');
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Statut bloquant explicite (pending, rejected, expired)
    if (isPending || isRejected || isExpired) {
      console.log('[BetaGuard] Beta user with blocked status:', betaInfo.status);
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Accès accordé (status=active)
    console.log('[BetaGuard] Access granted', { status: betaInfo.status });
  }, [user, betaInfo, isPending, isRejected, isExpired, authLoading, betaLoading, navigate, location.pathname]);

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

  // Bloquer si : non connecté, pas de betaInfo, ou statut bloquant
  if (!user || !betaInfo || isPending || isRejected || isExpired) {
    return null;
  }

  return <>{children}</>;
};

export default BetaGuard;
