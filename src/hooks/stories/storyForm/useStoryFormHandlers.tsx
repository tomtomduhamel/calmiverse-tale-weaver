
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
      setError(null);
    }
  }, [error, setError]);

  // Gestionnaire de sélection d'enfant simplifié
  const handleChildToggle = useCallback((childId: string) => {
    if (!childId) return;
    
    setFormData(prev => {
      const currentIds = [...(prev.childrenIds || [])];
      const isSelected = currentIds.includes(childId);
      
      // Création d'un nouvel array pour éviter les problèmes de référence
      const newIds = isSelected
        ? currentIds.filter(id => id !== childId)
        : [...currentIds, childId];
        
      return {
        ...prev,
        childrenIds: newIds
      };
    });
    
    // Réinitialisation ciblée de l'erreur si nécessaire
    if (error && (error.toLowerCase().includes('enfant') || error.toLowerCase().includes('child'))) {
      resetError();
    }
  }, [setFormData, error, resetError]);

  // Gestionnaire d'objectif simplifié
  const setObjective = useCallback((objective: string) => {
    setFormData(prev => ({ ...prev, objective }));
    
    // Réinitialisation ciblée de l'erreur si nécessaire
    if (error && (error.toLowerCase().includes('objectif') || error.toLowerCase().includes('objective'))) {
      resetError();
    }
  }, [setFormData, error, resetError]);

  return {
    handleChildToggle,
    setObjective,
    resetError
  };
};
