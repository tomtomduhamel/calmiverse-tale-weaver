import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import type { StoryFormData } from "@/components/StoryForm";
import { generateStoryPrompt } from "@/lib/story-themes";
import type { StoryTheme } from "@/types/story-theme";

interface Story {
  id: string;
  title: string;
  preview: string;
  theme: string;
  objective: string;
}

type StoryObjective = "sleep" | "relax" | "focus";

export const useStories = () => {
  const [currentStory, setCurrentStory] = useState<string>("");
  const [stories, setStories] = useState<Story[]>([]);
  const { toast } = useToast();

  const handleCreateStory = async (formData: StoryFormData, children: Child[], selectedTheme: StoryTheme) => {
    try {
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      const prompt = generateStoryPrompt(selectedTheme, formData.objective as StoryObjective, childrenNames);
      
      toast({
        title: "Information",
        description: "Pour utiliser cette fonctionnalité, vous devez configurer une Cloud Function Firebase. Contactez votre administrateur.",
      });
      return;

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la génération de l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteStory = (storyId: string) => {
    setStories((prevStories) => prevStories.filter((story) => story.id !== storyId));
  };

  return {
    stories,
    currentStory,
    handleCreateStory,
    handleDeleteStory,
    setCurrentStory,
  };
};