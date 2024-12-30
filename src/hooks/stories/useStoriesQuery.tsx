import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Story } from '@/types/story';
import { formatStoryFromFirestore } from './storyFormatters';

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    console.log('🔄 Initialisation du listener des histoires...');
    const storiesQuery = query(collection(db, 'stories'));

    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      try {
        console.log('📥 Réception de la mise à jour Firestore avec', snapshot.docs.length, 'histoires');
        const loadedStories = snapshot.docs.map(doc => formatStoryFromFirestore(doc));
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

  return stories;
};