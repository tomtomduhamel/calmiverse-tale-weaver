
import { useCallback } from "react";

/**
 * Hook pour valider le formulaire d'histoire
 */
export function useFormValidation(
  selectedChildrenIds: string[],
  selectedObjective: string,
  user: any
) {
  // Fonction de validation
  const validateForm = useCallback(() => {
    console.log("[useFormValidation] validateForm called with:", {
      childrenCount: selectedChildrenIds?.length || 0,
      objectiveSelected: !!selectedObjective,
      userAuthenticated: !!user,
    });
    
    // Vérification de l'authentification
    if (!user) {
      return { isValid: false, error: "Vous devez être connecté pour créer une histoire" };
    }
    
    // Vérification de la sélection d'enfant
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      console.error("[useFormValidation] Validation failed: No children selected");
      return { isValid: false, error: "Veuillez sélectionner au moins un enfant pour créer une histoire" };
    }
    
    // Vérification de l'objectif
    if (!selectedObjective) {
      console.error("[useFormValidation] Validation failed: No objective selected");
      return { isValid: false, error: "Veuillez sélectionner un objectif pour l'histoire" };
    }
    
    return { isValid: true, error: null };
  }, [selectedChildrenIds, selectedObjective, user]);

  return { validateForm };
}
