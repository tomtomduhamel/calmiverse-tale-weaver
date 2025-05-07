
import { useCallback } from 'react';
import { useSimpleStoryFormState } from './useSimpleStoryFormState';
import { useSimpleStoryFormValidation } from './useSimpleStoryFormValidation';
import { useSimpleStoryFormHandlers } from './useSimpleStoryFormHandlers';
import type { Child } from '@/types/child';
import type { Story } from '@/types/story';

/**
 * Main hook that combines state, validation and handlers for the simplified story form
 */
export const useSimpleStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[],
  onStoryCreated: (story: Story) => void
) => {
  // Get form state
  const {
    selectedChildrenIds,
    setSelectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    showChildForm,
    setShowChildForm,
    user,
    session,
    authLoading
  } = useSimpleStoryFormState();

  // Get form validation
  const { validateForm } = useSimpleStoryFormValidation(
    selectedChildrenIds,
    selectedObjective,
    user,
    session
  );

  // Get form handlers
  const {
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    isGenerateButtonDisabled
  } = useSimpleStoryFormHandlers(
    selectedChildrenIds,
    setSelectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    formError,
    setFormError,
    isSubmitting,
    setIsSubmitting,
    validateForm,
    onSubmit,
    onStoryCreated
  );

  // Child form interface
  const childFormControls = {
    showChildForm,
    setShowChildForm
  };

  return {
    // Form state
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    authLoading,
    isGenerateButtonDisabled,
    
    // Form handlers
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    
    // Child form controls
    childFormControls
  };
};
