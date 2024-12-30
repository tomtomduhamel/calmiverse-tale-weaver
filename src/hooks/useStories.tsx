import { useState, useEffect, useCallback } from "react";
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
    const storiesQuery = query(collection(db, 'stories'));
    let unsubscribe: () => void;

    const setupSubscription = async () => {
      try {
        unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
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
      } catch (error) {
        console.error("Erreur lors de la configuration de l'écoute:", error);
      }
    };

    setupSubscription();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [toast]);

  const handleCreateStory = useCallback(async (formData: StoryFormData, children: Child[]): Promise<string> => {
    try {
      console.log('Début de la création de la demande d\'histoire');
      
      // Récupérer les noms des enfants sélectionnés
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);

      const storyData = {
        title: `Histoire pour ${childrenNames.join(' et ')}`,
        preview: "Histoire en cours de génération...",
        objective: formData.objective,
        childrenIds: formData.childrenIds,
        childrenNames: childrenNames, // Ajout des noms des enfants
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
  }, [toast]);

  const handleDeleteStory = useCallback(async (storyId: string) => {
    try {
      await deleteDoc(doc(db, 'stories', storyId));
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
  }, [toast]);

  return {
    stories,
    currentStory,
    handleCreateStory,
    handleDeleteStory,
    setCurrentStory,
  };
};