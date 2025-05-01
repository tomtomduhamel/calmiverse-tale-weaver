
import { useState } from "react";
import { ToastAction } from "@/components/ui/toast";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

interface UseStoryFormSubmissionProps {
  user: any;
  formData: StoryFormData;
  handleSubmit: (e: React.FormEvent) => Promise<any>;
  toast: any;
  setFormError: (error: string | null) => void;
}

export const useStoryFormSubmission = ({
  user,
  formData,
  handleSubmit,
  toast,
  setFormError
}: UseStoryFormSubmissionProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    
    // Vérifier si l'utilisateur est connecté
    if (!user) {
      setFormError("Utilisateur non connecté");
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour créer une histoire",
        variant: "destructive",
      });
      return;
    }
    
    // Vérifier que des enfants ont été sélectionnés
    if (formData.childrenIds.length === 0) {
      setFormError("Veuillez sélectionner au moins un enfant");
      toast({
        title: "Erreur", 
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive",
      });
      return;
    }

    // Vérifier qu'un objectif a été sélectionné
    if (!formData.objective) {
      setFormError("Veuillez sélectionner un objectif pour l'histoire");
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un objectif pour l'histoire",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log("Soumission du formulaire avec utilisateur:", user.id);
      console.log("Données du formulaire:", formData);
      await handleSubmit(e);
      
      toast({
        title: "Création en cours",
        description: "Votre histoire est en cours de génération",
      });
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
      setFormError(error instanceof Error ? error.message : "Une erreur est survenue");
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors de la création",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return { isSubmitting, handleFormSubmit };
};
