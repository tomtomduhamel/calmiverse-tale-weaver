import React, { useState } from "react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/useStoryForm";
import LoadingStory from "./LoadingStory";
import CreateChildDialog from "./story/CreateChildDialog";
import ChildrenSelection from "./story/ChildrenSelection";
import StoryObjectives from "./story/StoryObjectives";
import StoryChat from "./story/chat/StoryChat";
import StoryFormHeader from "./story/form/StoryFormHeader";
import GenerateStoryButton from "./story/form/GenerateStoryButton";
import { useChildFormLogic } from "./story/useChildFormLogic";

const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { formData, isLoading, handleChildToggle, setObjective, handleSubmit } = useStoryForm(onStoryCreated, onSubmit);
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    console.log("Données du formulaire soumises:", formData);
    handleSubmit(e);
  };

  const handleModeSwitch = () => {
    setCreationMode(mode => mode === "classic" ? "chat" : "classic");
  };

  if (objectivesLoading) {
    return <div>Chargement des objectifs...</div>;
  }

  if (isLoading) {
    return <LoadingStory />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {creationMode === "classic" ? (
        <form onSubmit={handleFormSubmit} className="space-y-6 animate-fade-in bg-white dark:bg-muted-dark p-8 rounded-xl shadow-soft-lg transition-all hover:shadow-xl">
          <StoryFormHeader onModeSwitch={handleModeSwitch} />

          <ChildrenSelection
            children={children}
            selectedChildrenIds={formData.childrenIds}
            onChildToggle={handleChildToggle}
            onCreateChildClick={() => setShowChildForm(true)}
          />

          <div className="space-y-4">
            <label className="text-secondary dark:text-white text-lg font-medium">
              Je souhaite créer un moment de lecture qui va...
            </label>
            <StoryObjectives
              objectives={objectives}
              selectedObjective={formData.objective}
              onObjectiveSelect={setObjective}
            />
          </div>

          <GenerateStoryButton />
        </form>
      ) : (
        <div className="animate-fade-in">
          <StoryChat onSwitchMode={handleModeSwitch} />
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

export default StoryForm;