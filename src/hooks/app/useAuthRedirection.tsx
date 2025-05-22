
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";

/**
 * Hook spécialisé pour gérer la redirection basée sur l'état d'authentification
 */
export const useAuthRedirection = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useSupabaseAuth();

  useEffect(() => {
    if (!authLoading && !user) {
      console.log("User not logged in, redirecting to /auth");
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  return {
    user,
    authLoading,
    isAuthenticated: !!user
  };
};
