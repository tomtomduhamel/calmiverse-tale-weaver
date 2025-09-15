
import { useState, useEffect, useCallback, useMemo } from "react";
import { useStoryObjectives } from "@/hooks/useStoryObjectives";
import { useStoryForm } from "@/hooks/stories/storyForm";
import { useChildFormLogic } from "@/components/story/useChildFormLogic";
import { useStoryFormAuth } from "@/hooks/useStoryFormAuth";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";

/**
 * Hook principal contenant toute la logique pour le composant StoryFormContainer
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
  const { toast } = useToast();
  
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
  
  // Logique du formulaire d'enfant mise à jour pour utiliser les valeurs du state interne
  const {
    showChildForm,
    setShowChildForm,
    childName,
    childAge,
    setChildName,
    setChildAge,
    resetChildForm,
  } = useChildFormLogic(onCreateChild);

  // Mise à jour de la signature pour correspondre à celle attendue par CreateChildDialog (sans paramètres)
  const handleChildFormSubmit = useCallback(async () => {
    try {
      console.log("[useStoryFormContainer] handleChildFormSubmit called with:", childName, childAge);
      
      if (!childName || !childAge) {
        throw new Error("Le nom et l'âge de l'enfant sont requis");
      }
      
      // Calculer la date de naissance à partir de l'âge
      const now = new Date();
      const birthYear = now.getFullYear() - parseInt(childAge);
      const birthDate = new Date(birthYear, now.getMonth(), now.getDate());
      
      // Appeler la fonction de création d'enfant fournie par le parent
      await onCreateChild({
        name: childName,
        birthDate,
        gender: 'boy',
        authorId: user?.id || '',
        interests: []
      });
      
      setShowChildForm(false);
      resetChildForm();
      
    } catch (error) {
      console.error("[useStoryFormContainer] Error creating child:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création de l'enfant",
        variant: "destructive",
      });
    }
  }, [childName, childAge, onCreateChild, resetChildForm, setShowChildForm, toast, user?.id]);

  // Indicateur de progression simple
  const progress = formIsSubmitting ? 75 : 0;

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
    console.log("[useStoryFormContainer] handleFormSubmit appelé");
    try {
      await handleSubmit(e);
    } catch (error) {
      console.error("[useStoryFormContainer] Error submitting form:", error);
    }
  }, [handleSubmit]);

  // Synchronisation des erreurs
  useEffect(() => {
    if (storyFormError && storyFormError !== formError) {
      setFormError(storyFormError);
    }
  }, [storyFormError, formError]);
  
  // Mise à jour des informations de débogage
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
    
    console.log("[useStoryFormContainer] Form debug info updated:", debugInfo);
    setFormDebugInfo(debugInfo);
  }, [
    formData.childrenIds,
    formData.objective,
    formError,
    children?.length,
    formIsSubmitting
  ]);
  
  // Calcul mémorisé de l'état du bouton
  const isGenerateButtonDisabled = useMemo(() => {
    const hasNoChildren = !Array.isArray(formData.childrenIds) || formData.childrenIds.length === 0;
    const hasNoObjective = !formData.objective || formData.objective.trim() === '';
    
    console.log("[useStoryFormContainer] Calcul du bouton:", {
      formIsSubmitting,
      hasNoChildren,
      hasNoObjective,
      childrenIds: formData.childrenIds,
      objective: formData.objective,
      disabled: formIsSubmitting || hasNoChildren || hasNoObjective
    });
    
    return formIsSubmitting || hasNoChildren || hasNoObjective;
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
