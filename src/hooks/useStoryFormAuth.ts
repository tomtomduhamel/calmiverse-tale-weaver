
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useNavigate } from "react-router-dom";

export const useStoryFormAuth = (setFormError: (error: string | null) => void) => {
  const [authChecked, setAuthChecked] = useState(false);
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Vérifier si l'utilisateur est connecté et rediriger vers la page d'authentification si nécessaire
  useEffect(() => {
    console.log("Vérification de l'authentification dans useStoryFormAuth", { 
      user: user?.id, 
      authLoading,
      authChecked
    });
    
    if (!authLoading) {
      setAuthChecked(true);
      
      if (!user) {
        console.log("Utilisateur non connecté, affichage de l'erreur");
        setFormError("Utilisateur non connecté");
        toast({
          title: "Erreur",
          description: "Vous devez être connecté pour créer une histoire",
          variant: "destructive",
        });
      } else {
        console.log("Utilisateur connecté:", user.id);
        setFormError(null);
      }
    }
  }, [user, authLoading, toast, setFormError]);

  return {
    user,
    authLoading,
    authChecked,
    isAuthenticated: !!user
  };
};
