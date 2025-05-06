
import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

/**
 * Hook to manage the state of the story form with improved initialization
 */
export const useStoryFormState = () => {
  // Initialiser explicitement avec des valeurs par défaut correctes
  const [formData, setFormData] = useState<StoryFormData>({
    childrenIds: [],
    objective: "",
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, session, loading } = useSupabaseAuth();

  // Vérifier l'état de l'authentification au chargement du composant
  useEffect(() => {
    if (!loading) {
      console.log("État d'authentification dans useStoryFormState:", { 
        user: user?.id, 
        sessionExists: !!session,
        loading,
        formData
      });
      setAuthChecked(true);
    }
  }, [user, session, loading, formData]);

  return {
    formData,
    setFormData,
    isSubmitting,
    setIsSubmitting,
    isLoading,
    setIsLoading,
    authChecked,
    error,
    setError,
    user,
    session,
    loading
  };
};
