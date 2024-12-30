import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Story } from '@/types/story';

export const useStories = (children: any[] = []) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { toast } = useToast();

  // Fonction de validation des données d'histoire
  const validateStoryData = (data: any): boolean => {
    const requiredFields = ['title', 'status'];
    return requiredFields.every(field => {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`);
        return false;
      }
      return true;
    });
  };

  // Fonction pour sérialiser les données avant envoi
  const serializeStoryData = (data: any) => {
    const serialized = { ...data };
    
    // Convertir les timestamps en ISO strings
    if (serialized.createdAt && typeof serialized.createdAt.toDate === 'function') {
      serialized.createdAt = serialized.createdAt.toDate();
    }
    
    return serialized;
  };

  useEffect(() => {
    console.log('🔄 Initializing stories listener...');
    const storiesQuery = query(collection(db, 'stories'));

    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      try {
        console.log('📥 Received Firestore update with', snapshot.docs.length, 'stories');
        const loadedStories = snapshot.docs.map(doc => {
          const data = serializeStoryData(doc.data());
          return {
            id: doc.id,
            ...data,
            createdAt: new Date(data.createdAt || new Date())
          };
        }).filter(validateStoryData) as Story[];

        setStories(loadedStories);
        console.log('✅ Stories updated in state:', loadedStories.length);
      } catch (error) {
        console.error('❌ Error processing stories:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les histoires",
          variant: "destructive",
        });
      }
    });

    return () => {
      console.log('🔄 Cleaning up stories listener...');
      unsubscribe();
    };
  }, [toast]);

  const handleCreateStory = async (formData: { childrenIds: string[], objective: string }, children: any[]) => {
    try {
      console.log('🚀 Starting story creation process...', { formData });
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      const storyData = {
        title: `Histoire pour ${childrenNames.join(' et ')}`,
        preview: "Histoire en cours de génération...",
        objective: formData.objective,
        childrenIds: formData.childrenIds,
        childrenNames,
        status: 'pending',
        story_text: "Génération en cours...",
        story_summary: "Résumé en cours de génération...",
        createdAt: new Date()
      };

      console.log('📝 Preparing to save story with data:', JSON.stringify(storyData));
      const docRef = await addDoc(collection(db, 'stories'), storyData);
      console.log('✅ Story created successfully with ID:', docRef.id);

      toast({
        title: "Succès",
        description: "L'histoire est en cours de génération",
      });

      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating story:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleDeleteStory = async (storyId: string) => {
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error) {
      console.error('Error deleting story:', error);
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
    setCurrentStory,
    handleCreateStory,
    handleDeleteStory,
  };
};