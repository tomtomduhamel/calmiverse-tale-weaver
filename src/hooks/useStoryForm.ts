import { useState } from "react";
import { toast } from "@/hooks/use-toast";

export const useStoryForm = (onStoryCreated, onSubmit) => {
  const [formData, setFormData] = useState({ childrenIds: [], objective: "" });
  const [isLoading, setIsLoading] = useState(false);

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
    setIsLoading(true);

    try {
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
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'histoire",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    isLoading,
    handleChildToggle,
    setObjective,
    handleSubmit,
  };
};
