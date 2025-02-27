
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
import { Progress } from "./ui/progress";
import { useToast } from "@/hooks/use-toast";

const StoryForm: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { formData, isLoading, handleChildToggle, setObjective, handleSubmit } = useStoryForm(onStoryCreated, onSubmit);
  const { toast } = useToast();
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

  // Simulate progress for better UX
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Formulaire soumis avec les données:", formData);
    
    // Validate form data
    if (formData.childrenIds.length === 0) {
      toast({
        title: "Validation",
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive"
      });
      return;
    }
    
    if (!formData.objective) {
      toast({
        title: "Validation",
        description: "Veuillez sélectionner un objectif pour l'histoire",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      setProgress(5); // Start progress
      
      // Submit form data
      await handleSubmit(e);
      
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModeSwitch = () => {
    setCreationMode(mode => mode === "classic" ? "chat" : "classic");
  };

  if (objectivesLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="text-primary">Chargement des objectifs...</div>
    </div>;
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

          {isSubmitting && (
            <div className="space-y-2">
              <div className="text-sm text-muted-foreground">Préparation de votre histoire...</div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <GenerateStoryButton disabled={isSubmitting} />
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
