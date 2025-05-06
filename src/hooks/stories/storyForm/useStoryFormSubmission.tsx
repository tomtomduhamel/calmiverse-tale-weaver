
import { useCallback } from "react";
import type { User, Session } from "@supabase/supabase-js";
import type { StoryFormData } from "@/components/story/StoryFormTypes";
import { useToast } from "@/hooks/use-toast";

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

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("Form submission triggered with event:", e.type);
    
    if (isSubmitting) {
      console.log("Submission already in progress, ignoring");
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("Starting form submission with data:", {
        childrenIds: formData.childrenIds,
        objective: formData.objective,
        childrenIdsLength: formData.childrenIds?.length || 0
      });
      
      // Validate form before proceeding
      const validation = validateForm();
      if (!validation.isValid) {
        console.error("Validation error:", validation.error);
        setError(validation.error);
        throw new Error(validation.error || "Validation error");
      }
      
      // Reset error if validation succeeded
      setError(null);
      console.log("Attempting to create story, validated data:", formData);

      // Informer l'utilisateur que la création a commencé
      toast({
        title: "Création en cours",
        description: "Nous préparons votre histoire, veuillez patienter...",
      });

      // Call story creation function
      const storyId = await onSubmit(formData);
      console.log("Story creation initiated successfully, ID:", storyId);
      
      // Informer l'utilisateur que l'histoire est en cours de génération
      toast({
        title: "Histoire en préparation",
        description: "Votre histoire est en cours de génération, vous serez redirigé(e) lorsqu'elle sera prête.",
      });
      
      if (storyId && onStoryCreated) {
        onStoryCreated(storyId);
      }
      
      // Reset form data
      setFormData({
        childrenIds: [],
        objective: "",
      });
      
      return storyId;
    } catch (error: any) {
      console.error("Error creating story:", error);
      
      // Don't overwrite validation error if it exists
      if (!error) {
        setError(error?.message || "An error occurred while creating the story");
      }
      
      toast({
        title: "Erreur",
        description: error?.message || "Une erreur est survenue pendant la création de l'histoire",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, onSubmit, onStoryCreated, setError, setFormData, setIsSubmitting, toast, validateForm]);

  return { handleSubmit };
};
