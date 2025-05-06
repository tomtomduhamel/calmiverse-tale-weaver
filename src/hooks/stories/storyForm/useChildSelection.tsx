
import { useCallback } from "react";

/**
 * Hook simplifié pour gérer la sélection des enfants sans provoquer de boucles infinies
 */
export const useChildSelection = (
  childrenIds: string[],
  onChange: (newChildrenIds: string[]) => void,
  resetError?: () => void
) => {
  // Gestionnaire optimisé pour la sélection d'un enfant
  const handleChildSelect = useCallback((childId: string) => {
    if (!childId) {
      console.warn("handleChildSelect appelé sans childId valide");
      return;
    }
    
    console.log("handleChildSelect:", childId, "Current selection:", childrenIds);
    
    // On crée un nouvel array à chaque fois pour éviter les problèmes de référence
    const currentIds = Array.isArray(childrenIds) ? [...childrenIds] : [];
    const isSelected = currentIds.includes(childId);
    
    const newIds = isSelected
      ? currentIds.filter(id => id !== childId)
      : [...currentIds, childId];
    
    console.log("New selection will be:", newIds);
    
    onChange(newIds);
    
    // Si une fonction resetError est fournie, on l'appelle de manière asynchrone
    // pour éviter les boucles de mises à jour d'état
    if (resetError) {
      setTimeout(() => resetError(), 0);
    }
  }, [childrenIds, onChange, resetError]);

  return {
    handleChildSelect
  };
};
