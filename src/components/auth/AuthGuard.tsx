import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 🔐 GARDE D'AUTHENTIFICATION CENTRALISÉE
 * 
 * Ce composant protège les routes authentifiées de manière optimiste :
 * - Affiche immédiatement le contenu si l'utilisateur est déjà chargé
 * - Montre un loader uniquement si loading = true ET pas encore d'utilisateur
 * - Redirige vers /auth uniquement après timeout si pas d'utilisateur
 * - Évite les doubles vérifications d'auth dans les pages
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { user, loading, timeoutReached } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Redirection uniquement si :
    // 1. On n'est pas en train de charger
    // 2. Pas d'utilisateur
    // 3. OU timeout atteint sans utilisateur
    if ((!loading && !user) || (timeoutReached && !user)) {
      console.log('[AuthGuard] Redirection vers /auth - user absent');
      navigate('/auth', { state: { from: location.pathname } });
    }
  }, [user, loading, timeoutReached, navigate, location]);

  // Affichage optimiste : si on a un user, on affiche immédiatement
  if (user) {
    return <>{children}</>;
  }

  // Si loading ET pas encore de user, afficher un loader minimal
  if (loading && !timeoutReached) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Sinon, ne rien afficher (redirection en cours)
  return null;
};
