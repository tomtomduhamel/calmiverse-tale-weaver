import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Child } from "@/types/child";
import type { StoryFormData } from "@/components/StoryForm";
import { generateStoryPrompt } from "@/lib/story-themes";
import type { StoryTheme } from "@/types/story-theme";

interface Story {
  id: string;
  title: string;
  content: string;
  preview: string;
  theme: string;
  objective: string;
  childId: string;
  createdAt: Date;
}

type StoryObjective = "sleep" | "relax" | "focus";

export const useStories = () => {
  const [currentStory, setCurrentStory] = useState<string>("");
  const [stories, setStories] = useState<Story[]>([]);
  const { toast } = useToast();

  // Charger les histoires au démarrage
  useEffect(() => {
    const loadStories = async () => {
      try {
        const storiesCollection = collection(db, 'stories');
        const snapshot = await getDocs(storiesCollection);
        const loadedStories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })) as Story[];
        setStories(loadedStories);
      } catch (error) {
        console.error("Erreur lors du chargement des histoires:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les histoires",
          variant: "destructive",
        });
      }
    };

    loadStories();
  }, [toast]);

  const handleCreateStory = async (formData: StoryFormData, children: Child[], selectedTheme: StoryTheme): Promise<string> => {
    try {
      const selectedChild = children.find(child => child.id === formData.childrenIds[0]);
      if (!selectedChild) throw new Error("Enfant non trouvé");

      const prompt = generateStoryPrompt(selectedTheme, formData.objective as StoryObjective, [selectedChild.name]);
      
      const functions = getFunctions();
      const generateStory = httpsCallable(functions, 'generateStory');
      
      const result = await generateStory({ prompt });
      const generatedStory = result.data as string;
      
      if (!generatedStory) {
        throw new Error("L'histoire n'a pas pu être générée");
      }

      // Sauvegarder l'histoire dans Firestore
      const storyData = {
        content: generatedStory,
        title: `Histoire pour ${selectedChild.name}`,
        preview: generatedStory.substring(0, 200) + "...",
        theme: selectedTheme.name,
        objective: formData.objective,
        childId: selectedChild.id,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'stories'), storyData);
      
      const newStory = {
        id: docRef.id,
        ...storyData,
        createdAt: new Date()
      };

      setStories(prev => [...prev, newStory]);
      setCurrentStory(generatedStory);
      
      toast({
        title: "Succès",
        description: "L'histoire a été créée et sauvegardée",
      });

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

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      setStories((prevStories) => prevStories.filter((story) => story.id !== storyId));
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'histoire:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'histoire",
        variant: "destructive",
      });
    }
  };

  return {
    stories,
    currentStory,
    handleCreateStory,
    handleDeleteStory,
    setCurrentStory,
  };
};
