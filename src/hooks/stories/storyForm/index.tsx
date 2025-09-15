
import { useStoryFormState } from "./useStoryFormState";
import { useStoryFormValidation } from "./useStoryFormValidation";
import { useStoryFormHandlers } from "./useStoryFormHandlers";

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

  // Simplified submission handler using callbacks
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const validation = validateForm();
      if (!validation.isValid) {
        setError(validation.error);
        return;
      }
      
      const storyId = await onSubmit(formData);
      
      if (storyId && onStoryCreated) {
        onStoryCreated(storyId);
      }
      
      setFormData({ childrenIds: [], objective: "" });
      
    } catch (error: any) {
      setError(error?.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

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
  useStoryFormHandlers
};
