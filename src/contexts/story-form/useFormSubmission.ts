
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";

export const useFormSubmission = (
  onSubmit: (formData: { childrenIds: string[]; objective: string }) => Promise<string>,
  onStoryCreated: (story: Story) => void
) => {
  const { toast } = useToast();
  
  const handleSubmission = useCallback(async (
    selectedChildrenIds: string[],
    selectedObjective: string,
    setIsSubmitting: (loading: boolean) => void,
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
          content: "", // CORRECTION: utiliser 'content' au lieu de 'story_text'
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
      setFormError(error?.message || "Erreur lors de la création de l'histoire");
      toast({
        title: "Erreur",
        description: error?.message || "Erreur lors de la création de l'histoire",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [onSubmit, onStoryCreated, toast]);
  
  return { handleSubmission };
};
