
import { useStoryFormState } from "./useStoryFormState";
import { useStoryFormValidation } from "./useStoryFormValidation";
import { useStoryFormHandlers } from "./useStoryFormHandlers";
import { useStoryFormSubmission } from "./useStoryFormSubmission";

/**
 * Main hook for story form management, composed of smaller specialized hooks
 */
export const useStoryForm = (onStoryCreated: Function, onSubmit: Function) => {
  // Get form state
  const {
    formData,
    setFormData,
    isSubmitting, 
    setIsSubmitting,
    isLoading,
    authChecked,
    error,
    setError,
    user,
    session,
    loading
  } = useStoryFormState();

  // Get validation functions
  const { validateForm } = useStoryFormValidation(formData, user, session);

  // Get form handlers
  const {
    handleChildToggle,
    setObjective,
    resetError
  } = useStoryFormHandlers(formData, setFormData, error, setError);

  // Get submission handler
  const { handleSubmit } = useStoryFormSubmission(
    formData,
    setFormData,
    isSubmitting,
    setIsSubmitting,
    error,
    setError,
    user,
    session,
    onSubmit,
    onStoryCreated,
    validateForm
  );

  return {
    formData,
    isLoading,
    isSubmitting,
    error,
    authChecked,
    handleChildToggle,
    setObjective,
    handleSubmit,
    resetError,
    validateForm,
  };
};

export { 
  useStoryFormState,
  useStoryFormValidation,
  useStoryFormHandlers,
  useStoryFormSubmission
};
