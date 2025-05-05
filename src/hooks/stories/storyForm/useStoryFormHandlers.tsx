
import { useCallback } from "react";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

/**
 * Hook to handle form data updates and error management
 */
export const useStoryFormHandlers = (
  formData: StoryFormData,
  setFormData: React.Dispatch<React.SetStateAction<StoryFormData>>,
  error: string | null,
  setError: (error: string | null) => void
) => {
  // Simplifier la logique de mise à jour des enfants sélectionnés
  const handleChildToggle = useCallback((childId: string) => {
    // Vérification simple
    if (!childId) return;
    
    setFormData((prev) => {
      const currentIds = prev.childrenIds || [];
      const isSelected = currentIds.includes(childId);
      
      return { 
        ...prev, 
        childrenIds: isSelected
          ? currentIds.filter(id => id !== childId)
          : [...currentIds, childId]
      };
    });
    
    // Réinitialisation de l'erreur si nécessaire
    if (error && error.toLowerCase().includes("enfant")) {
      setError(null);
    }
  }, [setFormData, setError, error]);

  const setObjective = useCallback((objective: string) => {
    setFormData((prev) => ({ ...prev, objective }));
    
    if (error && error.toLowerCase().includes("objectif")) {
      setError(null);
    }
  }, [setFormData, setError, error]);

  const resetError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    handleChildToggle,
    setObjective,
    resetError
  };
};
