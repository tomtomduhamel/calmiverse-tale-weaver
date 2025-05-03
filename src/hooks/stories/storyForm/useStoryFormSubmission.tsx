
import { useToast } from "@/hooks/use-toast";
import { useStoryFormValidation } from "./useStoryFormValidation";
import type { StoryFormData } from "@/components/story/StoryFormTypes";
import type { User, Session } from "@supabase/supabase-js";

/**
 * Hook to handle form submission
 */
export const useStoryFormSubmission = (
  formData: StoryFormData,
  setFormData: React.Dispatch<React.SetStateAction<StoryFormData>>,
  isSubmitting: boolean,
  setIsSubmitting: (isSubmitting: boolean) => void,
  error: string | null,
  setError: (error: string | null) => void,
  user: User | null,
  session: Session | null,
  onSubmit: Function,
  onStoryCreated: Function,
  validateForm: () => { isValid: boolean; error: string | null }
) => {
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) {
      console.log("Soumission déjà en cours, ignorée");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Début de soumission du formulaire avec données:", {
        childrenIds: formData.childrenIds,
        objective: formData.objective,
        childrenIdsLength: formData.childrenIds?.length || 0
      });
      
      // Valider le formulaire avant de continuer
      const validation = validateForm();
      if (!validation.isValid) {
        console.error("Erreur de validation:", validation.error);
        setError(validation.error);
        throw new Error(validation.error || "Erreur de validation");
      }
      
      // Réinitialiser l'erreur si la validation a réussi
      setError(null);
      console.log("Tentative de création d'histoire, données validées:", formData);

      // Appeler la fonction de création d'histoire
      const storyId = await onSubmit(formData);
      console.log("Histoire créée avec succès, ID:", storyId);
      
      if (storyId && onStoryCreated) {
        onStoryCreated(storyId);
      }
      
      toast({
        title: "Histoire en cours de création",
        description: "Nous générons votre histoire, cela peut prendre quelques instants.",
      });
      
      // Réinitialiser le formulaire
      setFormData({
        childrenIds: [],
        objective: "",
      });
      
      return storyId;
    } catch (error: any) {
      console.error("Erreur lors de la création de l'histoire:", error);
      
      // Ne pas écraser une erreur de validation si elle existe déjà
      if (!error) {
        setError(error?.message || "Une erreur est survenue lors de la création de l'histoire");
      }
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmit };
};
