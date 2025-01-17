import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Story } from '@/types/story';
import { formatStoryFromFirestore } from './storyFormatters';

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);

  useEffect(() => {
    if (!auth.currentUser) return;

    console.log('🔄 Initialisation du listener des histoires...');

    // Créer une requête pour les histoires de l'utilisateur et les histoires partagées avec lui
    const storiesQuery = query(
      collection(db, 'stories'),
      where('authorId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(storiesQuery, (snapshot) => {
      const loadedStories = snapshot.docs.map(formatStoryFromFirestore);
      console.log('📥 Réception de la mise à jour Firestore avec', loadedStories.length, 'histoires');
      console.log('Histoires chargées:', loadedStories);
      setStories(loadedStories);
    }, (error) => {
      console.error('Erreur lors du chargement des histoires:', error);
    });

    return () => unsubscribe();
  }, []);

  return stories;
};