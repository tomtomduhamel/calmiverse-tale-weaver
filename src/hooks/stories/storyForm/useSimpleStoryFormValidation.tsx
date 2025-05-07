
import { useCallback } from 'react';

/**
 * Hook for validating the simplified story form
 */
export const useSimpleStoryFormValidation = (
  selectedChildrenIds: string[],
  selectedObjective: string,
  user: any,
  session: any
) => {
  const validateForm = useCallback(() => {
    console.log('[useSimpleStoryFormValidation] Validating form:', {
      childrenIds: selectedChildrenIds,
      objective: selectedObjective,
      user: !!user,
      session: !!session
    });
    
    if (!user || !session) {
      return { isValid: false, error: 'Vous devez être connecté pour créer une histoire' };
    }
    
    if (!selectedChildrenIds || selectedChildrenIds.length === 0) {
      return { isValid: false, error: 'Veuillez sélectionner au moins un enfant pour créer une histoire' };
    }
    
    if (!selectedObjective) {
      return { isValid: false, error: 'Veuillez sélectionner un objectif pour l\'histoire' };
    }
    
    return { isValid: true, error: null };
  }, [selectedChildrenIds, selectedObjective, user, session]);

  return {
    validateForm
  };
};
