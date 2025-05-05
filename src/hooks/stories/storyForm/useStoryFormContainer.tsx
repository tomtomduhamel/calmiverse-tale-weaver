
import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { user, authLoading } = useStoryFormAuth(setFormError);
  
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

  // Event handlers
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
  
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSubmit(e).catch(error => {
      console.error("Error submitting form:", error);
    });
  }, [handleSubmit]);

  // Synchronize errors - with proper dependency array
  useEffect(() => {
    if (storyFormError && storyFormError !== formError) {
      setFormError(storyFormError);
    }
  }, [storyFormError]);
  
  // Update debug info in a separate effect with proper dependencies
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
    
    setFormDebugInfo(debugInfo);
  }, [
    formData.childrenIds,
    formData.objective,
    formError,
    children?.length,
    formIsSubmitting
  ]);
  
  // Clear error if children are selected - in separate effect with proper dependencies
  useEffect(() => {
    if (formError?.includes("select at least one child") && 
        formData.childrenIds && 
        formData.childrenIds.length > 0) {
      resetError();
    }
  }, [formData.childrenIds, formError, resetError]);

  // Mémoriser la valeur pour éviter les recalculs
  const isGenerateButtonDisabled = useMemo(() => {
    const noChildSelected = !formData.childrenIds || formData.childrenIds.length === 0;
    const noObjectiveSelected = !formData.objective;
    return formIsSubmitting || noChildSelected || noObjectiveSelected;
  }, [formData.childrenIds, formData.objective, formIsSubmitting]);

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
    handleChildToggle,
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
    isGenerateButtonDisabled
  };
};
