import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";
import type { StoryFormData } from "@/components/StoryForm";

interface Story {
  id: string;
  title: string;
  preview: string;
  theme: string;
  objective: string;
}

export const useStories = () => {
  const [currentStory, setCurrentStory] = useState<string>("");
  const [stories, setStories] = useState<Story[]>([
    {
      id: "1",
      title: "L'aventure magique",
      preview: "Une histoire enchantée pour les petits rêveurs...",
      theme: "magic",
      objective: "sleep",
    },
  ]);
  const { toast } = useToast();

  const handleCreateStory = async (formData: StoryFormData, children: Child[]) => {
    try {
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name).join(" et ");
      
      const mockStory = `Il était une fois ${childrenNames} qui ${
        formData.objective === "sleep" ? "se préparaient pour dormir" : 
        formData.objective === "relax" ? "voulaient se détendre" : 
        "cherchaient à se concentrer"
      }...`;
      
      setCurrentStory(mockStory);
      return mockStory;
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