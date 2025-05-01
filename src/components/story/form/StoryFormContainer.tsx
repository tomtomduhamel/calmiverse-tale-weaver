
import React, { useState } from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/useStoryForm";
import LoadingStory from "@/components/LoadingStory";
import CreateChildDialog from "../CreateChildDialog";
import StoryChat from "../chat/StoryChat";
import { useChildFormLogic } from "../useChildFormLogic";
import { StoryFormContent } from "./StoryFormContent";
import { useNavigate } from "react-router-dom";
import { StoryError } from "./StoryError";
import { useStoryFormSubmission } from "./hooks/useStoryFormSubmission";
import { useStoryProgress } from "./hooks/useStoryProgress";
import { useStoryFormAuth } from "@/hooks/useStoryFormAuth";
import { useNotifications } from "@/hooks/useNotifications";

const StoryFormContainer: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const [formError, setFormError] = useState<string | null>(null);
  
  // Utilisation du nouveau hook d'authentification
  const { user, authLoading, authChecked } = useStoryFormAuth(setFormError);
  
  // Utilisation du nouveau hook de notifications
  const { toast } = useNotifications(setFormError);
  
  const { formData, isLoading, error, handleChildToggle, setObjective, handleSubmit, resetError } = useStoryForm(onStoryCreated, onSubmit);
  
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

  const { isSubmitting, handleFormSubmit } = useStoryFormSubmission({
    user,
    formData,
    handleSubmit,
    toast,
    setFormError
  });

  const { progress } = useStoryProgress(isSubmitting);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-primary">Vérification de l'authentification...</div>
      </div>
    );
  }

  if (objectivesLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-primary">Chargement des objectifs...</div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingStory />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      {creationMode === "classic" ? (
        <>
          {formError && <StoryError error={formError} />}
          <StoryFormContent
            children={children}
            selectedChildrenIds={formData.childrenIds}
            onChildToggle={handleChildToggle}
            onCreateChildClick={() => setShowChildForm(true)}
            objective={formData.objective}
            setObjective={setObjective}
            objectives={objectives || [
              { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
              { id: "focus", label: "Se concentrer", value: "focus" },
              { id: "relax", label: "Se détendre", value: "relax" },
              { id: "fun", label: "S'amuser", value: "fun" },
            ]}
            isSubmitting={isSubmitting}
            progress={progress}
            formError={formError || error}
            onSubmit={handleFormSubmit}
            onModeSwitch={() => setCreationMode("chat")}
          />
        </>
      ) : (
        <div className="animate-fade-in">
          <StoryChat onSwitchMode={() => setCreationMode("classic")} />
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
