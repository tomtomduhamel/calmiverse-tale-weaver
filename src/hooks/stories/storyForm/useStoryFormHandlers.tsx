
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
  // Gestionnaire de sélection d'enfant optimisé
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
    
    // Réinitialisation ciblée de l'erreur dans un callback séparé pour éviter les boucles
    if (error && (error.toLowerCase().includes('enfant') || error.toLowerCase().includes('child'))) {
      setTimeout(() => setError(null), 0);
    }
  }, [setFormData, setError, error]);

  // Gestionnaire d'objectif optimisé
  const setObjective = useCallback((objective: string) => {
    setFormData(prev => ({ ...prev, objective }));
    
    // Réinitialisation ciblée de l'erreur dans un callback séparé
    if (error && (error.toLowerCase().includes('objectif') || error.toLowerCase().includes('objective'))) {
      setTimeout(() => setError(null), 0);
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
