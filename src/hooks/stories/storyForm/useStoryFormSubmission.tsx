
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

      // Call story creation function
      const storyId = await onSubmit(formData);
      console.log("Story created successfully, ID:", storyId);
      
      if (storyId && onStoryCreated) {
        onStoryCreated(storyId);
      }
      
      toast({
        title: "Story is being created",
        description: "We are generating your story, this may take a few moments.",
      });
      
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
        title: "Error",
        description: error?.message || "An error occurred while creating the story",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, isSubmitting, onSubmit, onStoryCreated, setError, setFormData, setIsSubmitting, toast, validateForm]);

  return { handleSubmit };
};
