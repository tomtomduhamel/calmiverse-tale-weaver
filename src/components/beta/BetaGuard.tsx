import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useBetaStatus } from '@/hooks/beta/useBetaStatus';
import { Card } from '@/components/ui/card';

interface BetaGuardProps {
  children: React.ReactNode;
}

/**
 * BetaGuard - Protège les routes en vérifiant le statut beta de l'utilisateur
 * 
 * Redirige vers :
 * - /auth si l'utilisateur n'est pas connecté
 * - /beta-pending si le statut est EXPLICITEMENT bloquant (pending_validation, rejected, expired)
 * 
 * IMPORTANT : Ne bloque JAMAIS sur l'absence d'entrée beta_users (betaInfo = null).
 * - Les utilisateurs sans entrée (admin, legacy) passent librement.
 * - Les nouveaux inscrits reçoivent toujours un statut pending_validation via RPC.
 * - Bloquer sur betaInfo=null cause une boucle infinie (null → /beta-pending → / → null → ...).
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

    // Statut bloquant EXPLICITE uniquement
    if (betaInfo && (isPending || isRejected || isExpired)) {
      console.log('[BetaGuard] Blocking status:', betaInfo.status, '→ /beta-pending');
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Accès accordé (status=active, ou pas d'entrée = admin/legacy/erreur query)
    console.log('[BetaGuard] Access granted', {
      hasBetaInfo: !!betaInfo,
      status: betaInfo?.status ?? 'no-record',
    });
  }, [user, betaInfo, isPending, isRejected, isExpired, authLoading, betaLoading, navigate]);

  // Loader pendant vérification
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

  // Non connecté ou statut bloquant → null (redirection en cours)
  if (!user || (betaInfo && (isPending || isRejected || isExpired))) {
    return null;
  }

  // Accès accordé
  return <>{children}</>;
};

export default BetaGuard;
