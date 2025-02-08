
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Story } from '@/types/story';
import { formatStoryFromFirestore } from './storyFormatters';

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Initialisation du listener des histoires...');
    setIsLoading(true);

    const storiesQuery = query(
      collection(db, 'stories'),
      where('authorId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(storiesQuery, 
      (snapshot) => {
        try {
          const loadedStories = snapshot.docs.map(formatStoryFromFirestore);
          console.log('📥 Réception de la mise à jour Firestore avec', loadedStories.length, 'histoires');
          console.log('Histoires chargées:', loadedStories);

          // Filtre les histoires non valides ou incomplètes
          const validStories = loadedStories.filter(story => {
            const isValid = story && story.id && (
              story.status === 'completed' || 
              story.status === 'pending' || 
              story.status === 'read'
            );
            if (!isValid) {
              console.warn('Histoire invalide détectée:', story);
            }
            return isValid;
          });

          setStories(validStories);
          setError(null);
        } catch (err) {
          console.error('Erreur lors du formatage des histoires:', err);
          setError(err instanceof Error ? err : new Error('Erreur inconnue'));
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erreur lors du chargement des histoires:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { stories, isLoading, error };
};
