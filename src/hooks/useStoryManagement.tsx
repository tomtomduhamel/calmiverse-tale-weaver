
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Story } from "@/types/story";
import type { StoryFormData } from "@/components/story/StoryFormTypes";
import type { ViewType } from "@/types/views";

export const useStoryManagement = (
  createStory: (formData: StoryFormData, children?: any[]) => Promise<string>,
  deleteStory: (storyId: string) => Promise<any>, // Modification ici pour accepter tout type de retour
  setCurrentView: (view: ViewType) => void
) => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { toast } = useToast();

  const handleStorySubmit = async (formData: StoryFormData): Promise<string> => {
    try {
      const story = await createStory(formData);
      return story;
    } catch (error: any) {
      console.error("Erreur lors de la création de l'histoire:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleStoryCreated = (story: Story) => {
    setCurrentStory(story);
    setCurrentView("reader");
  };

  const handleCloseReader = () => {
    setCurrentView("library");
    setCurrentStory(null);
  };

  const handleSelectStory = (story: Story) => {
    if (story.status === 'completed' || story.status === 'read') {
      setCurrentStory(story);
      setCurrentView("reader");
    } else {
      toast({
        title: "Histoire en cours de génération",
        description: "Cette histoire n'est pas encore disponible à la lecture",
      });
    }
  };

  return {
    currentStory,
    setCurrentStory,
    handleStorySubmit,
    handleStoryCreated,
    handleCloseReader,
    handleSelectStory,
  };
};
