import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Child } from "@/types/child";
import type { StoryFormData } from "@/components/StoryForm";

interface Story {
  id: string;
  title: string;
  content: string;
  preview: string;
  objective: string;
  childId: string;
  createdAt: Date;
  status: 'pending' | 'completed';
}

export const useStories = () => {
  const [currentStory, setCurrentStory] = useState<string>("");
  const [stories, setStories] = useState<Story[]>([]);
  const { toast } = useToast();

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

  const handleCreateStory = async (formData: StoryFormData, children: Child[]): Promise<string> => {
    try {
      console.log('Début de la création de la demande d\'histoire');
      
      const selectedChild = children.find(child => child.id === formData.childrenIds[0]);
      if (!selectedChild) {
        throw new Error("Enfant non trouvé");
      }

      // Création d'une nouvelle demande d'histoire dans Firestore
      const storyData = {
        title: `Histoire pour ${selectedChild.name}`,
        content: "", // Sera rempli par Make.com
        preview: "Histoire en cours de génération...",
        objective: formData.objective,
        childId: selectedChild.id,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      const storiesCollection = collection(db, 'stories');
      const docRef = await addDoc(storiesCollection, storyData);
      
      const newStory = {
        id: docRef.id,
        ...storyData,
        createdAt: new Date()
      } as Story;

      setStories(prev => [...prev, newStory]);
      
      console.log('Demande d\'histoire créée avec succès');
      toast({
        title: "Succès",
        description: "La demande d'histoire a été créée. L'histoire sera générée sous peu.",
      });

      return "pending";

    } catch (error) {
      console.error("Error creating story request:", error);
      if (error instanceof Error) {
        toast({
          title: "Erreur",
          description: error.message || "Une erreur est survenue lors de la création de la demande d'histoire",
          variant: "destructive",
        });
      }
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