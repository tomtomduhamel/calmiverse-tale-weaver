
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
  // Get form handlers which now include state
  const handlers = useSimpleStoryFormHandlers(onSubmit, onStoryCreated);
  
  // Get form state from useSimpleStoryFormState
  const {
    user,
    session,
    authLoading,
    showChildForm,
    setShowChildForm
  } = useSimpleStoryFormState();

  // Get form validation
  const { validateForm } = useSimpleStoryFormValidation(
    handlers.selectedChildrenIds,
    handlers.selectedObjective,
    user,
    session
  );

  // Child form interface
  const childFormControls = {
    showChildForm,
    setShowChildForm
  };

  return {
    // Form state from handlers
    selectedChildrenIds: handlers.selectedChildrenIds,
    selectedObjective: handlers.selectedObjective,
    formError: handlers.formError,
    isSubmitting: handlers.isSubmitting,
    authLoading,
    isGenerateButtonDisabled: handlers.isGenerateButtonDisabled,
    
    // Form handlers
    handleChildSelect: handlers.handleChildSelect,
    handleObjectiveSelect: handlers.handleObjectiveSelect,
    handleFormSubmit: handlers.handleFormSubmit,
    
    // Child form controls
    childFormControls
  };
};
