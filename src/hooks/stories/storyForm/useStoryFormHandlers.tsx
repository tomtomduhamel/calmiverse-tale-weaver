
import { useCallback } from "react";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

/**
 * Hook pour gérer les mises à jour du formulaire d'histoire sans provoquer de boucles infinies
 */
export const useStoryFormHandlers = (
  formData: StoryFormData,
  setFormData: React.Dispatch<React.SetStateAction<StoryFormData>>,
  error: string | null,
  setError: (error: string | null) => void
) => {
  // Fonction pour réinitialiser l'erreur de manière sécurisée
  const resetError = useCallback(() => {
    if (error) {
      console.log("[useStoryFormHandlers] Réinitialisation des erreurs");
      setError(null);
    }
  }, [error, setError]);

  // Gestionnaire de sélection d'enfant simplifié et robuste
  const handleChildToggle = useCallback((childId: string) => {
    if (!childId) {
      console.warn("[useStoryFormHandlers] handleChildToggle appelé sans childId valide");
      return;
    }
    
    console.log("[useStoryFormHandlers] Toggle child:", childId, "Current selection:", formData.childrenIds);
    
    setFormData(prev => {
      // Assurez-vous que childrenIds est un tableau valide
      const currentIds = Array.isArray(prev.childrenIds) ? [...prev.childrenIds] : [];
      const isSelected = currentIds.includes(childId);
      
      // Création d'un nouvel array pour éviter les problèmes de référence
      const newIds = isSelected
        ? currentIds.filter(id => id !== childId)
        : [...currentIds, childId];
      
      console.log("[useStoryFormHandlers] Nouvelle sélection:", newIds);
        
      return {
        ...prev,
        childrenIds: newIds
      };
    });
    
    // Réinitialisation ciblée de l'erreur si nécessaire
    if (error && (error.toLowerCase().includes('enfant') || error.toLowerCase().includes('child'))) {
      setTimeout(resetError, 0);
    }
  }, [formData.childrenIds, setFormData, error, resetError]);

  // Gestionnaire d'objectif simplifié et robuste
  const setObjective = useCallback((objective: string) => {
    console.log("[useStoryFormHandlers] Setting objective to:", objective);
    
    setFormData(prev => ({ ...prev, objective }));
    
    // Réinitialisation ciblée de l'erreur si nécessaire
    if (error && (error.toLowerCase().includes('objectif') || error.toLowerCase().includes('objective'))) {
      setTimeout(resetError, 0);
    }
  }, [setFormData, error, resetError]);

  return {
    handleChildToggle,
    setObjective,
    resetError
  };
};
