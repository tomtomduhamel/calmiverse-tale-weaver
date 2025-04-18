
import React, { useState } from "react";
import type { StoryFormProps } from "./story/StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/useStoryForm";
import LoadingStory from "./LoadingStory";
import CreateChildDialog from "./story/CreateChildDialog";
import StoryChat from "./story/chat/StoryChat";
import { useChildFormLogic } from "./story/useChildFormLogic";
import { StoryFormContent } from "./story/form/StoryFormContent";

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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);

  // Écouter les erreurs du processus de génération d'histoire
  React.useEffect(() => {
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setFormError(event.detail.message || "Une erreur est survenue");
        setIsSubmitting(false);
        setProgress(0);
      } else if (event.detail.type === 'success') {
        setFormError(null);
      }
    };
    
    document.addEventListener('app-notification', handleAppNotification as EventListener);
    
    return () => {
      document.removeEventListener('app-notification', handleAppNotification as EventListener);
    };
  }, []);

  // Simuler la progression pour une meilleure expérience utilisateur
  React.useEffect(() => {
    if (isSubmitting) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          const increment = Math.random() * 5;
          const newValue = prev + increment;
          return newValue >= 95 ? 95 : newValue;
        });
      }, 500);
      
      return () => clearInterval(interval);
    } else if (progress !== 0 && progress !== 100) {
      setProgress(100);
      setTimeout(() => setProgress(0), 1000);
    }
  }, [isSubmitting, progress]);

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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {creationMode === "classic" ? (
        <StoryFormContent
          children={children}
          selectedChildrenIds={formData.childrenIds}
          onChildToggle={handleChildToggle}
          onCreateChildClick={() => setShowChildForm(true)}
          objective={formData.objective}
          setObjective={setObjective}
          objectives={objectives}
          isSubmitting={isSubmitting}
          progress={progress}
          formError={formError}
          onSubmit={handleFormSubmit}
          onModeSwitch={() => setCreationMode("chat")}
        />
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

export default StoryForm;
