
import { useCallback, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";

export const useSimpleStoryFormHandlers = (
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>,
  onStoryCreated: (story: Story) => void
) => {
  const { toast } = useToast();
  const [selectedChildrenIds, setSelectedChildrenIds] = useState<string[]>([]);
  const [selectedObjective, setSelectedObjective] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  
  const handleChildSelect = useCallback((childId: string) => {
    setSelectedChildrenIds(prev => {
      const isSelected = prev.includes(childId);
      return isSelected 
        ? prev.filter(id => id !== childId)
        : [...prev, childId];
    });
  }, []);
  
  const handleObjectiveSelect = useCallback((objective: string) => {
    setSelectedObjective(objective);
  }, []);
  
  const handleFormSubmit = useCallback(async (
    selectedChildrenIds: string[],
    selectedObjective: string,
    setIsSubmitting: (submitting: boolean) => void,
    setFormError: (error: string | null) => void
  ) => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      const storyId = await onSubmit({
        childrenIds: selectedChildrenIds,
        objective: selectedObjective
      });
      
      if (storyId && onStoryCreated) {
        const tempStory: Story = {
          id: storyId,
          title: "Histoire en cours de génération",
          preview: "Génération en cours...",
          childrenIds: selectedChildrenIds,
          createdAt: new Date(),
          status: 'pending',
          content: "",
          story_summary: "",
          objective: selectedObjective
        };
        
        onStoryCreated(tempStory);
      }
      
      toast({
        title: "Histoire créée",
        description: "Votre histoire est en cours de génération",
      });
      
      return storyId;
      
    } catch (error: any) {
      setFormError(error?.message || "Erreur lors de la création");
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la création",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onStoryCreated, toast]);
  
  const isGenerateButtonDisabled = isSubmitting || selectedChildrenIds.length === 0 || !selectedObjective;
  
  return {
    selectedChildrenIds,
    setSelectedChildrenIds,
    selectedObjective,
    setSelectedObjective,
    isSubmitting,
    setIsSubmitting,
    formError,
    setFormError,
    handleChildSelect,
    handleObjectiveSelect,
    handleFormSubmit,
    isGenerateButtonDisabled
  };
};
