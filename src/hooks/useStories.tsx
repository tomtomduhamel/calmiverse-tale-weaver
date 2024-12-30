import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Story } from '@/types/story';

export const useStories = (children: any[] = []) => {
  const [stories, setStories] = useState<Story[]>([]);
  const [currentStory, setCurrentStory] = useState<Story | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔄 Initialisation du listener des histoires...');
    const storiesQuery = query(collection(db, 'stories'));

    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      try {
        console.log('📥 Réception de la mise à jour Firestore avec', snapshot.docs.length, 'histoires');
        const loadedStories = snapshot.docs.map(doc => {
          const data = doc.data();
          
          // Conversion sécurisée du timestamp
          let createdAtDate;
          try {
            createdAtDate = data.createdAt?.toDate?.() || new Date();
          } catch (e) {
            console.warn('Erreur lors de la conversion du timestamp:', e);
            createdAtDate = new Date();
          }

          // Création d'un objet simple et clonable
          const story: Story = {
            id: doc.id,
            id_stories: data.id_stories || `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: data.title || '',
            preview: data.preview || '',
            objective: data.objective || '',
            childrenIds: Array.isArray(data.childrenIds) ? [...data.childrenIds] : [],
            childrenNames: Array.isArray(data.childrenNames) ? [...data.childrenNames] : [],
            status: data.status || 'pending',
            story_text: data.story_text || '',
            story_summary: data.story_summary || '',
            createdAt: createdAtDate,
            isFavorite: Boolean(data.isFavorite),
            tags: Array.isArray(data.tags) ? [...data.tags] : []
          };

          return story;
        });

        console.log('Histoires chargées:', loadedStories);
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
      console.log('🚀 Début du processus de création d\'histoire...', formData);
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      // Génération d'un id_stories unique
      const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Création d'un objet simple et clonable
      const storyData = {
        id_stories: uniqueId,
        title: `Histoire pour ${childrenNames.join(' et ')}`,
        preview: "Histoire en cours de génération...",
        objective: formData.objective,
        childrenIds: [...formData.childrenIds],
        childrenNames: [...childrenNames],
        status: 'pending',
        story_text: "Génération en cours...",
        story_summary: "Résumé en cours de génération...",
        createdAt: serverTimestamp()
      };

      console.log('📝 Préparation à la sauvegarde de l\'histoire avec les données:', storyData);
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