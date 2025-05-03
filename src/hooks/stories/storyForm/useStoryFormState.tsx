
import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

/**
 * Hook to manage the state of the story form
 */
export const useStoryFormState = () => {
  const [formData, setFormData] = useState<StoryFormData>({
    childrenIds: [] as string[],
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
      console.log("État d'authentification dans useStoryForm:", { 
        user: user?.id, 
        sessionExists: !!session,
        loading
      });
      setAuthChecked(true);
    }
  }, [user, session, loading]);

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
