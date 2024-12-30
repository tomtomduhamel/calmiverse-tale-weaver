import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { collection, addDoc, getDocs, query, where, serverTimestamp, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Child } from "@/types/child";
import type { Story } from "@/types/story";
import type { StoryFormData } from "@/components/story/StoryFormTypes";

export const useStories = () => {
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const { toast } = useToast();

  // Fonction de validation des données d'histoire
  const validateStoryData = (data: any): boolean => {
    const requiredFields = ['title', 'status', 'story_text', 'story_summary'];
    return requiredFields.every(field => {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`, data);
        return false;
      }
      return true;
    });
  };

  useEffect(() => {
    console.log('🔄 Initializing stories listener...');
    const storiesQuery = query(collection(db, 'stories'));
    let unsubscribe: () => void;

    const setupSubscription = async () => {
      try {
        unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
          console.log('📥 Received Firestore update with', snapshot.docs.length, 'stories');
          const loadedStories = snapshot.docs.map(doc => {
            const data = doc.data();
            // Conversion des dates en format ISO
            const createdAt = data.createdAt?.toDate 
              ? data.createdAt.toDate().toISOString()
              : new Date().toISOString();

            return {
              id: doc.id,
              ...data,
              createdAt: new Date(createdAt)
            };
          }).filter(validateStoryData) as Story[];

          setStories(loadedStories);
          console.log('✅ Stories updated in state:', loadedStories.length);
        }, (error) => {
          console.error("❌ Error listening to stories:", error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les histoires en temps réel",
            variant: "destructive",
          });
        });
      } catch (error) {
        console.error("❌ Error setting up stories listener:", error);
      }
    };

    setupSubscription();
    return () => {
      if (unsubscribe) {
        console.log('🔄 Cleaning up stories listener...');
        unsubscribe();
      }
    };
  }, [toast]);

  const handleCreateStory = useCallback(async (formData: StoryFormData, children: Child[]): Promise<string> => {
    try {
      console.log('🚀 Starting story creation process...', { formData });
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      const storyData = {
        title: `Histoire pour ${childrenNames.join(' et ')}`,
        preview: "Histoire en cours de génération...",
        objective: formData.objective,
        childrenIds: formData.childrenIds,
        childrenNames: childrenNames,
        status: 'pending' as const,
        story_text: "",
        story_summary: "Résumé en cours de génération...",
        createdAt: serverTimestamp()
      };

      if (!validateStoryData(storyData)) {
        throw new Error("Données d'histoire invalides");
      }

      console.log('📝 Preparing to save story with data:', JSON.stringify(storyData));
      const storiesCollection = collection(db, 'stories');
      const docRef = await addDoc(storiesCollection, storyData);
      console.log('✅ Story created successfully with ID:', docRef.id);
      
      toast({
        title: "Succès",
        description: "La demande d'histoire a été créée. L'histoire sera générée sous peu.",
      });

      return docRef.id;
    } catch (error) {
      console.error("❌ Error creating story:", error);
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
      console.log('🗑️ Attempting to delete story:', storyId);
      await deleteDoc(doc(db, 'stories', storyId));
      console.log('✅ Story deleted successfully');
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error) {
      console.error("❌ Error deleting story:", error);
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