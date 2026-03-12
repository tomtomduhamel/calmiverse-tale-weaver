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
 * - /beta-pending si l'utilisateur a un statut bloquant EXPLICITE (pending, rejected, expired)
 * 
 * IMPORTANT : Les utilisateurs sans entrée dans beta_users (admin, utilisateurs legacy)
 * sont laissés passer. Seuls les utilisateurs avec un statut bloquant EXPLICITE sont bloqués.
 * Les nouveaux inscrits reçoivent systématiquement un statut `pending_validation` à l'inscription.
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

    // Bloquer UNIQUEMENT si l'utilisateur a un statut bloquant EXPLICITE dans beta_users
    // (pending_validation, rejected, expired)
    // Les utilisateurs sans entrée beta_users (admin, legacy) passent librement
    if (betaInfo && (isPending || isRejected || isExpired)) {
      console.log('[BetaGuard] Beta user with blocked status:', betaInfo.status);
      navigate('/beta-pending', { replace: true });
      return;
    }

    // Accès accordé
    console.log('[BetaGuard] Access granted', { 
      hasBetaInfo: !!betaInfo,
      status: betaInfo?.status ?? 'no-record (admin/legacy)',
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

  // Si non authentifié, bloquer
  if (!user) {
    return null;
  }

  // Si statut bloquant explicite, ne rien afficher (redirection en cours)
  if (betaInfo && (isPending || isRejected || isExpired)) {
    return null;
  }

  // Accès accordé (beta actif OU pas d'entrée beta_users = admin/legacy)
  return <>{children}</>;
};

export default BetaGuard;
