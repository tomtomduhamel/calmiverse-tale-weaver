
import { useCallback } from "react";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

/**
 * Hook pour gérer les mises à jour du formulaire d'histoire et la gestion des erreurs
 * Version refactorisée pour éviter les boucles de mise à jour
 */
export const useStoryFormHandlers = (
  formData: StoryFormData,
  setFormData: React.Dispatch<React.SetStateAction<StoryFormData>>,
  error: string | null,
  setError: (error: string | null) => void
) => {
  // Gestionnaire de sélection d'enfant optimisé
  const handleChildToggle = useCallback((childId: string) => {
    // Protection contre les valeurs invalides
    if (!childId) return;
    
    // Mise à jour immutable de l'état pour éviter les problèmes de référence
    setFormData((prev) => {
      const currentIds = prev.childrenIds || [];
      const isSelected = currentIds.includes(childId);
      
      // Créer un nouvel array plutôt que de modifier l'existant
      return { 
        ...prev, 
        childrenIds: isSelected
          ? currentIds.filter(id => id !== childId)
          : [...currentIds, childId]
      };
    });
    
    // Réinitialisation ciblée de l'erreur
    if (error && (error.toLowerCase().includes('enfant') || error.toLowerCase().includes('child'))) {
      setError(null);
    }
  }, [setFormData, setError, error]);

  // Gestionnaire d'objectif optimisé
  const setObjective = useCallback((objective: string) => {
    setFormData((prev) => ({ ...prev, objective }));
    
    // Réinitialisation ciblée de l'erreur
    if (error && (error.toLowerCase().includes('objectif') || error.toLowerCase().includes('objective'))) {
      setError(null);
    }
  }, [setFormData, setError, error]);

  // Réinitialisation simple des erreurs
  const resetError = useCallback(() => {
    setError(null);
  }, [setError]);

  return {
    handleChildToggle,
    setObjective,
    resetError
  };
};
