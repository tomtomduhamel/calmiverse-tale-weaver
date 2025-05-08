
import { useState } from 'react';
import { useSimpleStoryForm } from './useSimpleStoryForm';
import type { Child } from '@/types/child';
import type { Story } from '@/types/story';

/**
 * Hook qui fournit une interface simplifiée pour le formulaire d'histoire
 * Adapté à la nouvelle architecture unifiée
 */
export const useDirectStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[],
  onStoryCreated: (story: Story) => void
) => {
  // Utiliser notre nouveau hook simplifié
  const {
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    authLoading,
    showChildForm,
    setShowChildForm,
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    isGenerateButtonDisabled,
    debugInfo
  } = useSimpleStoryForm(onSubmit, children, onStoryCreated);

  return {
    // État du formulaire
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    authLoading,
    
    // État du formulaire enfant
    showChildForm,
    setShowChildForm,
    
    // Gestionnaires
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    
    // État du bouton
    isGenerateButtonDisabled,
    
    // Débogage
    debugInfo,
    
    // Structure pour la compatibilité
    childFormControls: {
      showChildForm, 
      setShowChildForm
    }
  };
};
