import { collection, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { createStoryData } from './storyFormatters';

export const useStoryMutations = () => {
  const { toast } = useToast();

  const createStory = async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('🚀 Début du processus de création d\'histoire...', formData);
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      const storyData = {
        ...createStoryData(formData, childrenNames),
        authorId: auth.currentUser.uid,
        sharedWith: []
      };

      console.log('📝 Préparation à la sauvegarde de l\'histoire avec les données:', storyData);
      const storiesRef = collection(db, 'stories');
      const docRef = await addDoc(storiesRef, storyData);
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
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      const storyRef = doc(db, 'stories', storyId);
      await deleteDoc(storyRef);
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
    createStory,
    deleteStory,
  };
};