
import { useState } from "react";
import { useSupabaseChildren } from "./useSupabaseChildren";
import { useSupabaseStories } from "./useSupabaseStories";
import { useToast } from "./use-toast";

export const useStoryForm = (onStoryCreated: Function, onSubmit: Function) => {
  const [formData, setFormData] = useState({
    childrenIds: [] as string[],
    objective: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { children } = useSupabaseChildren();
  const { createStory } = useSupabaseStories();
  const { toast } = useToast();

  const handleChildToggle = (childId: string) => {
    setFormData((prev) => {
      const childrenIds = prev.childrenIds.includes(childId)
        ? prev.childrenIds.filter((id) => id !== childId)
        : [...prev.childrenIds, childId];
      return { ...prev, childrenIds };
    });
  };

  const setObjective = (objective: string) => {
    setFormData((prev) => ({ ...prev, objective }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);

      if (!formData.objective) {
        throw new Error("Veuillez sélectionner un objectif pour l'histoire");
      }

      if (formData.childrenIds.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant");
      }

      // Appeler la fonction de création d'histoire
      const storyId = await createStory(formData, children);
      
      if (onStoryCreated) {
        onStoryCreated(storyId);
      }
      
      if (onSubmit) {
        onSubmit(formData);
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
    } catch (error: any) {
      console.error("Erreur lors de la création de l'histoire:", error);
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

  return {
    formData,
    isLoading,
    isSubmitting,
    handleChildToggle,
    setObjective,
    handleSubmit,
  };
};
