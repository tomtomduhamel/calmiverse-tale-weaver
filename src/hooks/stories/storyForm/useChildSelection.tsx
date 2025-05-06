
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
    if (!childId) return;
    
    // On crée un nouvel array à chaque fois pour éviter les problèmes de référence
    const currentIds = [...childrenIds];
    const isSelected = currentIds.includes(childId);
    
    const newIds = isSelected
      ? currentIds.filter(id => id !== childId)
      : [...currentIds, childId];
    
    onChange(newIds);
    
    // Si une fonction resetError est fournie, on l'appelle
    if (resetError) {
      resetError();
    }
  }, [childrenIds, onChange, resetError]);

  return {
    handleChildSelect
  };
};
