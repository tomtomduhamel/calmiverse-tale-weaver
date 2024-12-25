import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
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

  const handleCreateStory = async (formData: StoryFormData, children: Child[], selectedTheme: StoryTheme): Promise<string> => {
    try {
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      const prompt = generateStoryPrompt(selectedTheme, formData.objective as StoryObjective, childrenNames);
      
      const functions = getFunctions();
      const generateStory = httpsCallable(functions, 'generateStory');
      
      const result = await generateStory({ prompt });
      const generatedStory = result.data as string;
      
      if (!generatedStory) {
        throw new Error("L'histoire n'a pas pu être générée");
      }
      
      setCurrentStory(generatedStory);
      return generatedStory;

    } catch (error) {
      console.error("Error generating story:", error);
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