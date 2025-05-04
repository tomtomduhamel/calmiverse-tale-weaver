
import React, { useState, useEffect, useCallback } from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/stories/storyForm";
import LoadingStory from "@/components/LoadingStory";
import CreateChildDialog from "../CreateChildDialog";
import StoryChat from "../chat/StoryChat";
import { useChildFormLogic } from "../useChildFormLogic";
import { StoryFormContent } from "./StoryFormContent";
import { useStoryProgress } from "./hooks/useStoryProgress";
import { useStoryFormAuth } from "@/hooks/useStoryFormAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useIsMobile } from "@/hooks/use-mobile";

const StoryFormContainer: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const [formError, setFormError] = useState<string | null>(null);
  const [formDebugInfo, setFormDebugInfo] = useState<any>({});
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

  // Loading states
  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-primary">Verifying authentication...</div>
      </div>
    );
  }

  if (objectivesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-primary">Loading objectives...</div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingStory />;
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${isMobile ? 'h-full' : ''}`}>
      {/* Masquer les informations de débogage en production */}
      {process.env.NODE_ENV === 'development' && !isMobile && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 mb-4 rounded-lg text-xs">
          <h3 className="font-bold mb-1">Debug Information (dev only)</h3>
          <pre>{JSON.stringify(formDebugInfo, null, 2)}</pre>
        </div>
      )}
      
      {creationMode === "classic" ? (
        <>
          <StoryFormContent
            children={children}
            selectedChildrenIds={formData.childrenIds}
            onChildToggle={handleChildToggleMemoized}
            onCreateChildClick={showChildFormHandler}
            objective={formData.objective}
            setObjective={handleObjectiveSelect}
            objectives={objectives || [
              { id: "sleep", label: "Help sleep", value: "sleep" },
              { id: "focus", label: "Focus", value: "focus" },
              { id: "relax", label: "Relax", value: "relax" },
              { id: "fun", label: "Have fun", value: "fun" },
            ]}
            isSubmitting={formIsSubmitting}
            progress={progress}
            formError={formError}
            onSubmit={handleFormSubmit}
            onModeSwitch={handleCreationModeSwitch}
            isGenerateButtonDisabled={isGenerateButtonDisabled()}
          />
        </>
      ) : (
        <div className="animate-fade-in">
          <StoryChat onSwitchMode={handleCreationModeSwitch} />
        </div>
      )}

      <CreateChildDialog
        open={showChildForm}
        onOpenChange={setShowChildForm}
        childName={childName}
        childAge={childAge}
        onSubmit={handleChildFormSubmit}
        onReset={resetChildForm}
        onChildNameChange={setChildName}
        onChildAgeChange={setChildAge}
      />
    </div>
  );
};

export default StoryFormContainer;
