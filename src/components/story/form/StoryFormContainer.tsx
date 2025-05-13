import React from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import { useStoryFormContainer } from "@/hooks/stories/storyForm/useStoryFormContainer";
import LoadingStory from "@/components/LoadingStory";
import CreateChildDialog from "../CreateChildDialog";
import StoryChat from "../chat/StoryChat";
import { StoryFormContent } from "./StoryFormContent";
import StoryFormDebugInfo from "./StoryFormDebugInfo";
import StoryFormLoading from "./StoryFormLoading";

const StoryFormContainer: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const {
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
  } = useStoryFormContainer(onSubmit, children, onCreateChild, onStoryCreated);

  // Loading states
  if (authLoading) {
    return <StoryFormLoading loadingType="auth" />;
  }

  if (objectivesLoading) {
    return <StoryFormLoading loadingType="objectives" />;
  }

  if (isLoading) {
    return <LoadingStory />;
  }

  console.log("[StoryFormContainer] Rendering with formIsSubmitting:", formIsSubmitting, "isGenerateButtonDisabled:", isGenerateButtonDisabled);

  return (
    <div className={`w-full max-w-4xl mx-auto ${isMobile ? 'h-full' : ''}`}>
      {/* Debug information component */}
      <StoryFormDebugInfo formDebugInfo={formDebugInfo} isMobile={isMobile} />
      
      {creationMode === "classic" ? (
        <StoryFormContent
          children={children}
          selectedChildrenIds={formData.childrenIds}
          onChildToggle={handleChildToggle}
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
          isGenerateButtonDisabled={isGenerateButtonDisabled}
        />
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
