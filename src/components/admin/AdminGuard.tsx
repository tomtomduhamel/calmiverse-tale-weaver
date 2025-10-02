import React from "react";
import { useIsAdmin } from "@/hooks/auth/useIsAdmin";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { Navigate, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AdminGuardProps {
  children: React.ReactNode;
}

const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { isAdmin, loading } = useIsAdmin();
  const navigate = useNavigate();

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <Card className="p-6"><p>Vérification des droits...</p></Card>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <h1 className="text-xl font-semibold">Accès refusé</h1>
          <p>Cette page est réservée aux administrateurs.</p>
          <Button onClick={() => navigate('/')}>Retour à l'accueil</Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminGuard;
