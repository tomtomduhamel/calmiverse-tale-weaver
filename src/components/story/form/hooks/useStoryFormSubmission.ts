
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
        throw new Error("Aucun identifiant d'histoire n'a été retourné");
      }
      
      console.log("Story created successfully with ID:", storyId);
      
      toast({
        title: "Succès",
        description: "Votre histoire est en cours de génération.",
      });
      
      if (onStoryCreated) {
        // Ajouter un délai pour s'assurer que l'histoire a été complètement générée
        await new Promise(resolve => setTimeout(resolve, 500));
        onStoryCreated(storyId);
      }
      
      return storyId;
    } catch (error: any) {
      console.error("Error submitting story form:", error);
      
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue";
      setError(errorMessage);
      
      toast({
        title: "Erreur",
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
