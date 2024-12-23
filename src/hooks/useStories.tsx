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

  const getOpenAIKey = () => {
    return localStorage.getItem('openai_api_key');
  };

  const setOpenAIKey = (key: string) => {
    localStorage.setItem('openai_api_key', key);
  };

  const handleCreateStory = async (formData: StoryFormData, children: Child[], selectedTheme: StoryTheme) => {
    try {
      const apiKey = getOpenAIKey();
      
      if (!apiKey) {
        const key = prompt("Veuillez entrer votre clé API OpenAI :");
        if (!key) {
          toast({
            title: "Erreur",
            description: "Une clé API OpenAI est nécessaire pour générer des histoires",
            variant: "destructive",
          });
          return;
        }
        setOpenAIKey(key);
      }

      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      const prompt = generateStoryPrompt(selectedTheme, formData.objective as StoryObjective, childrenNames);
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getOpenAIKey()}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('openai_api_key');
          toast({
            title: "Erreur d'authentification",
            description: "Votre clé API OpenAI n'est pas valide. Veuillez réessayer avec une nouvelle clé.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Erreur lors de la génération de l\'histoire');
      }

      const data = await response.json();
      const generatedStory = data.choices[0].message.content;
      
      setCurrentStory(generatedStory);
      return generatedStory;
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