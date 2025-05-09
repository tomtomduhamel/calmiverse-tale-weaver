
import { useCallback } from "react";
import { useNotificationCenter } from "@/hooks/useNotificationCenter";
import type { Story } from "@/types/story";

interface UseFormSubmissionProps {
  selectedChildrenIds: string[];
  selectedObjective: string;
  isSubmitting: boolean;
  setError: (error: string | null) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  resetForm: () => void;
  validateForm: () => { isValid: boolean; error: string | null };
  onSubmit: (formData: { childrenIds: string[], objective: string }) => Promise<string>;
  onStoryCreated: (story: Story) => void;
  updateDebugInfo: (info: Record<string, any>) => void;
}

/**
 * Hook optimisé pour gérer la soumission du formulaire
 */
export function useFormSubmission({
  selectedChildrenIds,
  selectedObjective,
  isSubmitting,
  setError,
  setIsSubmitting,
  resetForm,
  validateForm,
  onSubmit,
  onStoryCreated,
  updateDebugInfo
}: UseFormSubmissionProps) {
  const { notifySuccess, notifyError, notifyInfo } = useNotificationCenter();
  
  // Gestionnaire de soumission optimisé
  const handleFormSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[useFormSubmission] handleFormSubmit called");
    
    // Éviter les soumissions multiples
    if (isSubmitting) {
      console.warn("[useFormSubmission] Form already submitting, ignoring duplicate submission");
      return;
    }
    
    try {
      // Valider le formulaire
      const validation = validateForm();
      if (!validation.isValid) {
        console.error("[useFormSubmission] Form validation failed:", validation.error);
        setError(validation.error);
        notifyError(
          "Erreur de validation", 
          validation.error || "Veuillez vérifier le formulaire"
        );
        return;
      }
      
      // Commencer la soumission
      console.log("[useFormSubmission] Form validation passed, starting submission");
      setIsSubmitting(true);
      setError(null);
      
      // Notifier l'utilisateur
      notifyInfo(
        "Création en cours", 
        "Nous préparons votre histoire, veuillez patienter..."
      );
      
      // Journaliser les données soumises
      console.log("[useFormSubmission] Submitting data:", {
        childrenIds: selectedChildrenIds,
        objective: selectedObjective,
        childrenCount: selectedChildrenIds.length
      });
      
      updateDebugInfo({
        submissionTimestamp: new Date().toISOString(),
        submittedChildrenIds: [...selectedChildrenIds],
        submittedObjective: selectedObjective
      });
      
      // Appeler l'API
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      console.log("[useFormSubmission] Story created successfully, ID:", storyId);
      
      // Notification de succès
      notifySuccess(
        "Histoire en préparation",
        "Votre histoire est en cours de génération, vous serez notifié(e) lorsqu'elle sera prête."
      );
      
      // Appeler le callback de succès
      if (onStoryCreated && storyId) {
        onStoryCreated({
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          story_text: "",
          story_summary: "",
          objective: selectedObjective
        } as Story);
      }
      
      // Réinitialiser le formulaire
      resetForm();
      
      return storyId;
    } catch (error: any) {
      console.error("[useFormSubmission] Error during submission:", error);
      setError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      
      notifyError(
        "Erreur",
        error?.message || "Une erreur est survenue pendant la création de l'histoire"
      );

      updateDebugInfo({
        errorTimestamp: new Date().toISOString(),
        errorMessage: error?.message || "Unknown error",
        errorStack: error?.stack || null
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    selectedChildrenIds,
    selectedObjective,
    setError,
    setIsSubmitting,
    resetForm,
    validateForm,
    onSubmit,
    onStoryCreated,
    updateDebugInfo,
    notifySuccess,
    notifyError,
    notifyInfo
  ]);

  return { handleFormSubmit };
}
