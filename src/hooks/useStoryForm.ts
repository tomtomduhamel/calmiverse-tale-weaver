
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export const useStoryForm = (onStoryCreated, onSubmit) => {
  const [formData, setFormData] = useState({ childrenIds: [], objective: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChildToggle = (childId) => {
    setFormData((prev) => {
      const isSelected = prev.childrenIds.includes(childId);
      return {
        ...prev,
        childrenIds: isSelected
          ? prev.childrenIds.filter((id) => id !== childId)
          : [...prev.childrenIds, childId],
      };
    });
  };

  const setObjective = (objective) => {
    setFormData((prev) => ({ ...prev, objective }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Basic validation
      if (formData.childrenIds.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant");
      }
      
      if (!formData.objective) {
        throw new Error("Veuillez sélectionner un objectif pour l'histoire");
      }
      
      const storyId = await onSubmit(formData);
      if (storyId) {
        toast({
          title: "Succès",
          description: "L'histoire est en cours de génération",
          className: "success-toast",
        });
        onStoryCreated(storyId);
      }
    } catch (error) {
      console.error("Erreur lors de la création:", error);
      setError(error instanceof Error ? error.message : "Une erreur est survenue");
      
      toast({
        title: "Erreur",
        description: error instanceof Error 
          ? error.message 
          : "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
      
      throw error; // Rethrow to allow the parent component to handle it
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    error,
    handleChildToggle,
    setObjective,
    handleSubmit,
    resetError: () => setError(null),
  };
};
