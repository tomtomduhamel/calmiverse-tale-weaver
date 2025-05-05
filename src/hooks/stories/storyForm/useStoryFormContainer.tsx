
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
 * Hook principal contenant toute la logique pour le composant StoryFormContainer
 * Refactorisé pour éviter les boucles de mise à jour d'état
 */
export const useStoryFormContainer = (
  onSubmit: (formData: any) => Promise<string>,
  children: Child[],
  onCreateChild: (child: Omit<Child, "id">) => void,
  onStoryCreated: (story: Story) => void
) => {
  // État local
  const [creationMode, setCreationMode] = useState<"classic" | "chat">("classic");
  const [formError, setFormError] = useState<string | null>(null);
  const [formDebugInfo, setFormDebugInfo] = useState<any>({});
  
  // Hooks externes
  const { objectives, isLoading: objectivesLoading } = useStoryObjectives();
  const isMobile = useIsMobile();
  
  // Hook d'authentification
  const { user, authLoading } = useStoryFormAuth(setFormError);
  
  // Hook de notifications
  const { toast } = useNotifications();
  
  // Hook de formulaire principal
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
  
  // Logique du formulaire d'enfant
  const childFormLogic = useChildFormLogic(onCreateChild);
  const {
    showChildForm,
    setShowChildForm,
    childName,
    childAge,
    handleChildFormSubmit,
    resetChildForm,
    setChildName,
    setChildAge,
  } = childFormLogic;

  // Indicateur de progression
  const { progress } = useStoryProgress(formIsSubmitting);

  // Gestionnaires d'événements stabilisés
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
  
  // Gestionnaire de soumission de formulaire stabilisé
  const handleFormSubmit = useCallback(async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("Error submitting form:", error);
    }
  }, [handleSubmit]);

  // Synchronisation des erreurs - une seule fois par changement réel
  useEffect(() => {
    if (storyFormError && storyFormError !== formError) {
      setFormError(storyFormError);
    }
  }, [storyFormError, formError]);
  
  // Mise à jour des informations de débogage dans un effet séparé
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
  
  // Effacer les erreurs spécifiques quand les conditions sont remplies
  useEffect(() => {
    if (
      formError?.includes("select at least one child") && 
      formData.childrenIds && 
      formData.childrenIds.length > 0
    ) {
      resetError();
    }
  }, [formData.childrenIds, formError, resetError]);

  // Calcul mémorisé de l'état du bouton
  const isGenerateButtonDisabled = useMemo(() => {
    const noChildSelected = !formData.childrenIds || formData.childrenIds.length === 0;
    const noObjectiveSelected = !formData.objective;
    return formIsSubmitting || noChildSelected || noObjectiveSelected;
  }, [formData.childrenIds, formData.objective, formIsSubmitting]);

  return {
    // États
    creationMode,
    formError,
    formDebugInfo,
    formData,
    showChildForm,
    childName,
    childAge,
    
    // États de chargement
    authLoading,
    objectivesLoading,
    isLoading,
    formIsSubmitting,
    
    // Données
    objectives,
    progress,
    isMobile,
    
    // Gestionnaires
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
    
    // Utilitaires
    isGenerateButtonDisabled
  };
};
