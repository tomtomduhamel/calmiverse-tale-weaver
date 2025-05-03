
import React, { useState, useEffect } from "react";
import type { StoryFormProps } from "../StoryFormTypes";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/stories/storyForm";
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
  const [formDebugInfo, setFormDebugInfo] = useState<any>({});
  
  // Utilisation du hook d'authentification
  const { user, authLoading, authChecked } = useStoryFormAuth(setFormError);
  
  // Utilisation du hook de notifications
  const { toast } = useNotifications(setFormError);
  
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

  // Utiliser le hook useStoryFormSubmission avec la fonction de soumission appropriée
  const { isSubmitting, handleSubmit: handleFormSubmit } = useStoryFormSubmission(
    onSubmit,
    onStoryCreated
  );

  const { progress } = useStoryProgress(isSubmitting || formIsSubmitting);

  // Synchroniser les erreurs
  useEffect(() => {
    if (storyFormError) {
      console.log("Erreur détectée dans StoryFormContainer:", storyFormError);
      setFormError(storyFormError);
    }
  }, [storyFormError]);
  
  // Journaliser l'état du formulaire pour débogage
  useEffect(() => {
    const debugInfo = {
      selectedChildrenIds: formData.childrenIds,
      selectedChildrenCount: formData.childrenIds?.length || 0,
      selectedObjective: formData.objective,
      childrenCount: children?.length || 0,
      hasError: !!formError,
      errorMessage: formError,
      isSubmitting: isSubmitting || formIsSubmitting
    };
    
    console.log("État actuel du formulaire:", debugInfo);
    setFormDebugInfo(debugInfo);
    
    // Effacer automatiquement l'erreur si des enfants sont sélectionnés
    if (formError?.includes("sélectionner au moins un enfant") && 
        formData.childrenIds && 
        formData.childrenIds.length > 0) {
      console.log("Effacement automatique de l'erreur car des enfants sont sélectionnés");
      setFormError(null);
      resetError();
    }
  }, [formData, formError, children, isSubmitting, formIsSubmitting, resetError]);

  // Vérifier si le bouton de génération doit être désactivé
  const isGenerateButtonDisabled = () => {
    const noChildSelected = !formData.childrenIds || formData.childrenIds.length === 0;
    const noObjectiveSelected = !formData.objective;
    const result = isSubmitting || formIsSubmitting || noChildSelected || noObjectiveSelected;
    
    console.log("État du bouton de génération:", { 
      disabled: result,
      noChildSelected,
      childrenIds: formData.childrenIds,
      noObjectiveSelected,
      isSubmitting: isSubmitting || formIsSubmitting
    });
    
    return result;
  };

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

  const handleFormSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Tentative de soumission du formulaire", {
      children: formData.childrenIds?.length || 0,
      childrenIds: formData.childrenIds,
      objective: formData.objective
    });
    
    // Réinitialiser les erreurs avant validation
    resetError();
    setFormError(null);
    
    try {
      // Vérifier explicitement la présence d'enfants
      if (!formData.childrenIds || !Array.isArray(formData.childrenIds) || formData.childrenIds.length === 0) {
        const errorMsg = "Veuillez sélectionner au moins un enfant pour créer une histoire";
        console.error(errorMsg, { 
          childrenIds: formData.childrenIds, 
          isArray: Array.isArray(formData.childrenIds),
          length: formData.childrenIds?.length || 0
        });
        setFormError(errorMsg);
        return;
      }
      
      // Vérifier explicitement la présence d'un objectif
      if (!formData.objective) {
        const errorMsg = "Veuillez sélectionner un objectif pour l'histoire";
        console.error(errorMsg, { objective: formData.objective });
        setFormError(errorMsg);
        return;
      }
      
      // Valider le formulaire complet avant soumission
      const validation = validateForm();
      if (!validation.isValid) {
        console.error("Erreur de validation complète:", validation.error);
        setFormError(validation.error);
        return;
      }
      
      console.log("Validation réussie, soumission du formulaire", {
        childrenIds: formData.childrenIds,
        objective: formData.objective
      });
      
      // Soumettre le formulaire si la validation réussit
      await handleSubmit(e);
    } catch (error: any) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      setFormError(error.message || "Une erreur est survenue");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-gray-100 dark:bg-gray-800 p-4 mb-4 rounded-lg text-xs">
          <h3 className="font-bold mb-1">Informations de débogage (dev uniquement)</h3>
          <pre>{JSON.stringify(formDebugInfo, null, 2)}</pre>
        </div>
      )}
      
      {creationMode === "classic" ? (
        <>
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
            isSubmitting={isSubmitting || formIsSubmitting}
            progress={progress}
            formError={formError}
            onSubmit={handleFormSubmission}
            onModeSwitch={() => setCreationMode("chat")}
            isGenerateButtonDisabled={isGenerateButtonDisabled()}
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
