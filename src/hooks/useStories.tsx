import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Child } from "@/types/child";
import type { StoryFormData } from "@/components/StoryForm";
import type { Story } from "@/types/story";

export const useStories = () => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const storiesCollection = collection(db, 'stories');
    const unsubscribe = onSnapshot(storiesCollection, (snapshot) => {
      const loadedStories = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      })) as Story[];
      setStories(loadedStories);
    }, (error) => {
      console.error("Erreur lors de l'écoute des histoires:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les histoires en temps réel",
        variant: "destructive",
      });
    });

    return () => unsubscribe();
  }, [toast]);

  const handleCreateStory = async (formData: StoryFormData, children: Child[]): Promise<string> => {
    try {
      console.log('Début de la création de la demande d\'histoire');
      
      const selectedChild = children.find(child => child.id === formData.childrenIds[0]);
      if (!selectedChild) {
        throw new Error("Enfant non trouvé");
      }

      const storyData = {
        title: `Histoire pour ${selectedChild.name}`,
        preview: "Histoire en cours de génération...",
        objective: formData.objective,
        childrenIds: formData.childrenIds,
        status: 'pending' as const,
        story_text: "",
        story_summary: "Résumé en cours de génération...",
        createdAt: serverTimestamp()
      };

      const storiesCollection = collection(db, 'stories');
      const docRef = await addDoc(storiesCollection, storyData);
      
      console.log('Demande d\'histoire créée avec succès');
      toast({
        title: "Succès",
        description: "La demande d'histoire a été créée. L'histoire sera générée sous peu.",
      });

      return docRef.id;

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