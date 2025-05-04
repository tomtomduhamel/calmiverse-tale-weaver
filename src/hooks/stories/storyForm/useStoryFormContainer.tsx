
import { useState, useEffect, useCallback } from "react";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/stories/storyForm";
import { useChildFormLogic } from "@/components/story/useChildFormLogic";
import { useStoryProgress } from "@/components/story/form/hooks/useStoryProgress";
import { useStoryFormAuth } from "@/hooks/useStoryFormAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

/**
 * Custom hook containing all the logic for the StoryFormContainer component
 */
export const useStoryFormContainer = (
  onSubmit: (formData: any) => Promise<string>,
  children: Child[],
  onCreateChild: (child: Omit<Child, "id">) => void,
  onStoryCreated: (story: Story) => void
) => {
  // State management
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const [formError, setFormError] = useState<string | null>(null);
  const [formDebugInfo, setFormDebugInfo] = useState<any>({});
  
  // Hooks
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const isMobile = useIsMobile();
  
  // Authentication hook
  const { user, authLoading, authChecked } = useStoryFormAuth(setFormError);
  
  // Notifications hook
  const { toast } = useNotifications(setFormError);
  
  // Story form hook
  const { 
    formData, 
    isLoading, 
    error: storyFormError, 
    handleChildToggle, 
    setObjective, 
    handleSubmit, 
    resetError,
    isSubmitting: formIsSubmitting,
    validateForm
  } = useStoryForm(onStoryCreated, onSubmit);
  
  // Child form logic
  const {
    showChildForm,
    setShowChildForm,
    childName,
    childAge,
    handleChildFormSubmit,
    resetChildForm,
    setChildName,
    setChildAge,
  } = useChildFormLogic(onCreateChild);

  // Progress indicator
  const { progress } = useStoryProgress(formIsSubmitting);

  // Memoize event handlers
  const handleChildToggleMemoized = useCallback((childId: string) => {
    handleChildToggle(childId);
  }, [handleChildToggle]);
  
  const handleCreationModeSwitch = useCallback(() => {
    setCreationMode(prevMode => 
      prevMode === "classic" ? "chat" : "classic"
    );
  }, []);
  
  const showChildFormHandler = useCallback(() => {
    setShowChildForm(true);
  }, [setShowChildForm]);
  
  const handleObjectiveSelect = useCallback((objective: string) => {
    setObjective(objective);
  }, [setObjective]);
  
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    await handleSubmit(e);
  }, [handleSubmit]);

  // Synchronize errors
  useEffect(() => {
    if (storyFormError) {
      console.log("Error detected in StoryFormContainer:", storyFormError);
      setFormError(storyFormError);
    }
  }, [storyFormError]);
  
  // Log form state for debugging
  useEffect(() => {
    const debugInfo = {
      selectedChildrenIds: formData.childrenIds,
      selectedChildrenCount: formData.childrenIds?.length || 0,
      selectedObjective: formData.objective,
      childrenCount: children?.length || 0,
      hasError: !!formError,
      errorMessage: formError,
      isSubmitting: formIsSubmitting
    };
    
    console.log("Current form state:", debugInfo);
    setFormDebugInfo(debugInfo);
    
    // Clear error automatically if children are selected
    if (formError?.includes("select at least one child") && 
        formData.childrenIds && 
        formData.childrenIds.length > 0) {
      console.log("Automatically clearing error as children are selected");
      setFormError(null);
      resetError();
    }
  }, [formData, formError, children, formIsSubmitting, resetError]);

  // Check if generate button should be disabled
  const isGenerateButtonDisabled = () => {
    const noChildSelected = !formData.childrenIds || formData.childrenIds.length === 0;
    const noObjectiveSelected = !formData.objective;
    const result = formIsSubmitting || noChildSelected || noObjectiveSelected;
    
    console.log("Generate button state:", { 
      disabled: result,
      noChildSelected,
      childrenIds: formData.childrenIds,
      noObjectiveSelected,
      isSubmitting: formIsSubmitting
    });
    
    return result;
  };

  return {
    // States
    creationMode,
    formError,
    formDebugInfo,
    formData,
    showChildForm,
    childName,
    childAge,
    
    // Loading states
    authLoading,
    objectivesLoading,
    isLoading,
    formIsSubmitting,
    
    // Data
    objectives,
    progress,
    isMobile,
    
    // Handlers
    handleChildToggle: handleChildToggleMemoized,
    handleCreationModeSwitch,
    showChildFormHandler,
    handleObjectiveSelect,
    handleFormSubmit,
    handleChildFormSubmit,
    setShowChildForm,
    setChildName,
    setChildAge,
    resetChildForm,
    
    // Utilities
    isGenerateButtonDisabled: isGenerateButtonDisabled()
  };
};
