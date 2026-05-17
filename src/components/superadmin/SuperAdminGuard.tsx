import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useIsSuperAdmin } from "@/hooks/auth/useIsSuperAdmin";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const SuperAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const { isSuperAdmin, loading } = useIsSuperAdmin();
  const navigate = useNavigate();

  if (authLoading || loading) {
    return <div className="p-6"><Card className="p-6"><p>Vérification des droits superadmin...</p></Card></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isSuperAdmin) {
    return (
      <div className="p-6">
        <Card className="p-6 space-y-3">
          <h1 className="text-xl font-semibold">Accès refusé</h1>
          <p>Cette zone est réservée au superadministrateur.</p>
          <Button onClick={() => navigate("/")}>Retour à l'accueil</Button>
        </Card>
      </div>
    );
  }
  return <>{children}</>;
};

export default SuperAdminGuard;
