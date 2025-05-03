
import { useCallback } from "react";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

/**
 * Hook to handle form data updates and error management
 */
export const useStoryFormHandlers = (
  formData: StoryFormData,
  setFormData: (formData: StoryFormData) => void,
  error: string | null,
  setError: (error: string | null) => void
) => {
  // Utilisation de useCallback pour éviter des rendus inutiles
  const handleChildToggle = useCallback((childId: string) => {
    console.log("Toggle enfant - DÉBUT:", {
      childId, 
      "État actuel": formData.childrenIds,
      "Est tableau?": Array.isArray(formData.childrenIds)
    });
    
    // Vérifier que childId est une chaîne valide
    if (!childId || typeof childId !== 'string') {
      console.error("ChildId invalide:", childId);
      return;
    }
    
    setFormData((prev) => {
      // S'assurer que nous avons toujours un tableau valide
      const currentIds = Array.isArray(prev.childrenIds) ? [...prev.childrenIds] : [];
      
      // Vérifier si l'ID est déjà présent
      const isSelected = currentIds.includes(childId);
      
      // Créer un nouveau tableau avec ou sans l'ID
      const updatedIds = isSelected
        ? currentIds.filter((id) => id !== childId)
        : [...currentIds, childId];
        
      console.log("Toggle enfant - APRÈS traitement:", {
        "ID enfant": childId,
        "État précédent": currentIds,
        "Déjà sélectionné?": isSelected,
        "Nouvel état": updatedIds
      });
      
      // Retourner le nouvel état avec le tableau mis à jour
      return { 
        ...prev, 
        childrenIds: updatedIds 
      };
    });
    
    // Réinitialiser l'erreur si elle concerne la sélection d'enfants
    if (error && error.includes("Veuillez sélectionner au moins un enfant")) {
      setError(null);
    }
  }, [formData.childrenIds, error, setFormData, setError]);

  const setObjective = useCallback((objective: string) => {
    console.log("Nouvel objectif sélectionné:", objective);
    setFormData((prev) => ({ ...prev, objective }));
    
    // Réinitialiser l'erreur si elle concerne l'objectif
    if (error && error.includes("Veuillez sélectionner un objectif")) {
      setError(null);
    }
  }, [error, setFormData, setError]);

  const resetError = useCallback(() => setError(null), [setError]);

  return {
    handleChildToggle,
    setObjective,
    resetError
  };
};
