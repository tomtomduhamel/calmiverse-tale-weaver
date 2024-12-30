import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Story } from '@/types/story';

export const useStories = (children: any[]) => {
  const [stories, setStories] = useState<Story[]>([]);
  const { toast } = useToast();

  // Fonction de validation des données d'histoire
  const validateStoryData = (data: any): boolean => {
    const requiredFields = ['title', 'status'];
    return requiredFields.every(field => {
      if (!data[field]) {
        console.error(`Missing required field: ${field}`, JSON.stringify(data));
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
      serialized.createdAt = serialized.createdAt.toDate().toISOString();
    }
    
    return serialized;
  };

  useEffect(() => {
    console.log('🔄 Initializing stories listener...');
    const storiesQuery = query(collection(db, 'stories'));
    let unsubscribe: () => void;

    const initializeListener = async () => {
      try {
        unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
          console.log('📥 Received Firestore update with', snapshot.docs.length, 'stories');
          const loadedStories = snapshot.docs.map(doc => {
            const data = serializeStoryData(doc.data());
            return {
              id: doc.id,
              ...data,
              createdAt: new Date(data.createdAt || new Date().toISOString())
            };
          }).filter(validateStoryData) as Story[];

          setStories(loadedStories);
          console.log('✅ Stories updated in state:', loadedStories.length);
        }, (error) => {
          console.error('❌ Error in stories listener:', error);
          toast({
            title: "Erreur",
            description: "Impossible de charger les histoires",
            variant: "destructive",
          });
        });
      } catch (error) {
        console.error('❌ Error initializing stories listener:', error);
      }
    };

    initializeListener();
    return () => {
      if (unsubscribe) {
        console.log('🔄 Cleaning up stories listener...');
        unsubscribe();
      }
    };
  }, [toast]);

  const createStory = async (formData: { childrenIds: string[], objective: string }) => {
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

  return {
    stories,
    createStory,
  };
};