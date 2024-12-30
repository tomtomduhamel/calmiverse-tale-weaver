import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { StoryFormData } from "@/components/story/StoryFormTypes";
import type { Child } from "@/types/child";

export const useStoryForm = (
  onStoryCreated: (story: any) => void,
  onSubmit: (data: StoryFormData) => Promise<string>
) => {
  const [formData, setFormData] = useState<StoryFormData>({
    childrenIds: [],
    objective: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChildToggle = (childId: string) => {
    setFormData((prev) => ({
      ...prev,
      childrenIds: prev.childrenIds.includes(childId)
        ? prev.childrenIds.filter((id) => id !== childId)
        : [...prev.childrenIds, childId],
    }));
  };

  const setObjective = (objective: string) => {
    setFormData({ ...formData, objective });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.childrenIds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un enfant",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.objective) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un objectif",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const generatedStory = await onSubmit(formData);
      if (generatedStory) {
        onStoryCreated(generatedStory);
      }
    } catch (error) {
      console.error("Erreur lors de la génération de l'histoire:", error);
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