
import { useState } from 'react';
import { useSimpleStoryForm } from './storyForm/useSimpleStoryForm';
import type { Child } from '@/types/child';
import type { Story } from '@/types/story';

/**
 * Hook that provides a simpler interface for the story form
 * It exposes all the necessary props for SimpleStoryForm component
 */
export const useDirectStoryForm = (
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>,
  children: Child[],
  onStoryCreated: (story: Story) => void
) => {
  // Use the main form hook
  const {
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    authLoading,
    isGenerateButtonDisabled,
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    childFormControls
  } = useSimpleStoryForm(onSubmit, children, onStoryCreated);

  // Destructure child form controls
  const { showChildForm, setShowChildForm } = childFormControls;

  return {
    // Form state
    selectedChildrenIds,
    selectedObjective,
    formError,
    isSubmitting,
    authLoading,
    
    // Child form state
    showChildForm,
    setShowChildForm,
    
    // Handlers
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    
    // Utilities
    isGenerateButtonDisabled
  };
};
