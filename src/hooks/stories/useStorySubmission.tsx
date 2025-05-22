
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { ViewType } from "@/types/views";

/**
 * Hook spécialisé pour gérer la soumission des histoires
 */
export const useStorySubmission = (
  handleStorySubmit: (formData: any) => Promise<string>,
  setCurrentView: (view: ViewType) => void,
  setPendingStoryId: (id: string | null) => void
) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleStorySubmitWrapper = async (formData: any): Promise<string> => {
    try {
      setIsSubmitting(true);
      const storyId = await handleStorySubmit(formData);
      
      if (storyId) {
        console.log("Story being created, ID:", storyId);
        setPendingStoryId(storyId);
        setCurrentView("library");
        
        toast({
          title: "Histoire en cours de création",
          description: "Nous préparons votre histoire, vous serez notifié(e) une fois terminée.",
        });
      }
      
      return storyId;
    } catch (error) {
      console.error("Story creation error:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    handleStorySubmitWrapper
  };
};
