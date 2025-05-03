
import { useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Hook to validate story form data
 */
export const useStoryFormValidation = (
  formData: StoryFormData,
  user: User | null,
  session: Session | null
) => {
  const validateForm = useCallback((): ValidationResult => {
    console.log("validateForm - Données actuelles à valider:", {
      userId: user?.id,
      sessionExists: !!session,
      childrenIds: formData.childrenIds,
      objective: formData.objective,
      childrenIdsLength: formData.childrenIds?.length || 0,
      childrenIdsIsArray: Array.isArray(formData.childrenIds)
    });
    
    // Vérification de l'authentification
    if (!user || !session) {
      console.error("Validation échouée: utilisateur non connecté", { user, session });
      return {
        isValid: false,
        error: "Vous devez être connecté pour créer une histoire"
      };
    }

    // Vérification de la sélection d'enfant avec debug détaillé
    if (!formData.childrenIds || !Array.isArray(formData.childrenIds)) {
      console.error("Validation échouée: childrenIds n'est pas un tableau", { 
        childrenIds: formData.childrenIds,
        type: typeof formData.childrenIds 
      });
      return {
        isValid: false,
        error: "Veuillez sélectionner au moins un enfant pour créer une histoire"
      };
    }
    
    if (formData.childrenIds.length === 0) {
      console.error("Validation échouée: aucun enfant sélectionné", { 
        childrenIds: formData.childrenIds,
        length: formData.childrenIds.length 
      });
      return {
        isValid: false,
        error: "Veuillez sélectionner au moins un enfant pour créer une histoire"
      };
    }

    // Vérification de l'objectif
    if (!formData.objective) {
      console.error("Validation échouée: aucun objectif sélectionné", { objective: formData.objective });
      return {
        isValid: false,
        error: "Veuillez sélectionner un objectif pour l'histoire"
      };
    }

    console.log("Validation réussie, données valides:", { ...formData });
    return { isValid: true, error: null };
  }, [formData, user, session]);

  return { validateForm };
};
