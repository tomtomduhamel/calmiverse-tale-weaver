import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Story } from '@/types/story';

export const useStoriesCollection = () => {
  const { toast } = useToast();

  const saveStory = async (content: string, childrenIds: string[], objective: string) => {
    try {
      const storyData = {
        content,
        childrenIds,
        objective,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'stories'), storyData);

      toast({
        title: "Succès",
        description: "L'histoire a été sauvegardée avec succès",
      });

      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de la sauvegarde de l'histoire:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    saveStory,
  };
};