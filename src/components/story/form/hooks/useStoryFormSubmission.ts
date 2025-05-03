
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useStoryFormSubmission = (
  onSubmit: (formData: any) => Promise<string>,
  onStoryCreated?: (storyId: string) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (formData: any) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      console.log("Submitting story form with data:", formData);
      
      const storyId = await onSubmit(formData);
      
      if (!storyId) {
        throw new Error("No story ID was returned");
      }
      
      console.log("Story created successfully with ID:", storyId);
      
      toast({
        title: "Success",
        description: "Your story is being generated.",
      });
      
      if (onStoryCreated) {
        // Add a delay to ensure the story has been completely generated
        await new Promise(resolve => setTimeout(resolve, 500));
        onStoryCreated(storyId);
      }
      
      return storyId;
    } catch (error: any) {
      console.error("Error submitting story form:", error);
      
      const errorMessage = error instanceof Error ? error.message : "An error occurred";
      setError(errorMessage);
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    handleSubmit,
    isSubmitting,
    error,
    setError,
  };
};
