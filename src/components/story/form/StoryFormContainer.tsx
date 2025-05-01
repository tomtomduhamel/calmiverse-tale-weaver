
import React, { useState, useEffect } from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/useStoryForm";
import LoadingStory from "@/components/LoadingStory";
import CreateChildDialog from "../CreateChildDialog";
import StoryChat from "../chat/StoryChat";
import { useChildFormLogic } from "../useChildFormLogic";
import { StoryFormContent } from "./StoryFormContent";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { StoryError } from "./StoryError";
import { useStoryFormSubmission } from "./hooks/useStoryFormSubmission";
import { useStoryProgress } from "./hooks/useStoryProgress";

const StoryFormContainer: React.FC<StoryFormProps> = ({
  onSubmit,
  children,
  onCreateChild,
  onStoryCreated,
}) => {
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const { formData, isLoading, error, authChecked, handleChildToggle, setObjective, handleSubmit, resetError } = useStoryForm(onStoryCreated, onSubmit);
  const { user, loading: authLoading } = useSupabaseAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
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

  const [formError, setFormError] = useState<string | null>(null);
  const { isSubmitting, handleFormSubmit } = useStoryFormSubmission({
    user,
    formData,
    handleSubmit,
    toast,
    setFormError
  });

  const { progress } = useStoryProgress(isSubmitting);
  
  // Vérifier si l'utilisateur est connecté et rediriger vers la page d'authentification si nécessaire
  useEffect(() => {
    console.log("Vérification de l'authentification dans StoryForm", { 
      user: user?.id, 
      authLoading,
      authChecked
    });
    
    if (!authLoading && !user) {
      console.log("Utilisateur non connecté, affichage de l'erreur");
      setFormError("Utilisateur non connecté");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une histoire",
        variant: "destructive",
      });
    } else if (user) {
      console.log("Utilisateur connecté:", user.id);
      setFormError(null);
    }
  }, [user, authLoading, toast, authChecked]);

  // Écouter les erreurs du processus de génération d'histoire
  useEffect(() => {
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setFormError(event.detail.message || "Une erreur est survenue");
      } else if (event.detail.type === 'success') {
        setFormError(null);
      }
    };
    
    document.addEventListener('app-notification', handleAppNotification as EventListener);
    
    return () => {
      document.removeEventListener('app-notification', handleAppNotification as EventListener);
    };
  }, []);

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
