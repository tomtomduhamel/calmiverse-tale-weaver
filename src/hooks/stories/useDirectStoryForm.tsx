
import { useState } from 'react';
import { useUnifiedStoryForm } from './useUnifiedStoryForm';
import type { Child } from '@/types/child';
import type { Story } from '@/types/story';

/**
 * Hook qui fournit une interface simplifiée pour le formulaire d'histoire
 * Il expose toutes les propriétés nécessaires pour le composant SimpleStoryForm
 */
export const useDirectStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[],
  onStoryCreated: (story: Story) => void
) => {
  // Utiliser notre nouveau hook unifié
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
    isGenerateButtonDisabled
  } = useUnifiedStoryForm(onSubmit, children, onStoryCreated);

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
    
    // Structure pour la compatibilité
    childFormControls: {
      showChildForm, 
      setShowChildForm
    }
  };
};
