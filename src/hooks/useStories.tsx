import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Story } from '@/types/story';

export const useStories = (children: any[] = []) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { toast } = useToast();

  // Fonction de sérialisation améliorée
  const serializeStoryData = (data: any) => {
    const serialized = { ...data };
    
    // Conversion des timestamps en chaînes ISO
    if (serialized.createdAt && typeof serialized.createdAt.toDate === 'function') {
      serialized.createdAt = serialized.createdAt.toDate().toISOString();
    }

    // Nettoyage des champs undefined ou functions
    Object.keys(serialized).forEach(key => {
      if (typeof serialized[key] === 'undefined') {
        delete serialized[key];
      }
      if (typeof serialized[key] === 'function') {
        delete serialized[key];
      }
    });
    
    return serialized;
  };

  useEffect(() => {
    console.log('🔄 Initialisation du listener des histoires...');
    const storiesQuery = query(collection(db, 'stories'));

    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      try {
        console.log('📥 Réception de la mise à jour Firestore avec', snapshot.docs.length, 'histoires');
        const loadedStories = snapshot.docs.map(doc => {
          const data = serializeStoryData(doc.data());
          return {
            id: doc.id,
            ...data,
            createdAt: new Date(data.createdAt || Date.now())
          };
        });

        console.log('Histoires chargées et sérialisées:', JSON.stringify(loadedStories));
        setStories(loadedStories);
      } catch (error) {
        console.error('❌ Erreur lors du traitement des histoires:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les histoires",
          variant: "destructive",
        });
      }
    });

    return () => {
      console.log('🔄 Nettoyage du listener des histoires...');
      unsubscribe();
    };
  }, [toast]);

  const createStory = async (formData: { childrenIds: string[], objective: string }) => {
    try {
      console.log('🚀 Début du processus de création d\'histoire...', JSON.stringify(formData));
      
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
        createdAt: new Date().toISOString()
      };

      console.log('📝 Préparation à la sauvegarde de l\'histoire avec les données:', JSON.stringify(storyData));
      const docRef = await addDoc(collection(db, 'stories'), storyData);
      console.log('✅ Histoire créée avec succès avec l\'ID:', docRef.id);

      toast({
        title: "Succès",
        description: "L'histoire est en cours de génération",
      });

      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'histoire:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    try {
      await deleteDoc(doc(db, 'stories', storyId));
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'histoire:', error);
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
    createStory,
    deleteStory,
  };
};