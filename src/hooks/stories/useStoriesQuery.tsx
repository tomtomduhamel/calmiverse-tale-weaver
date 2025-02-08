
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Story } from '@/types/story';
import { formatStoryFromFirestore } from './storyFormatters';

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) {
      setIsLoading(false);
      return;
    }

    console.log('🔄 Initialisation du listener des histoires...', {
      userId: auth.currentUser.uid,
      retryCount
    });

    setIsLoading(true);

    const storiesQuery = query(
      collection(db, 'stories'),
      where('authorId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      storiesQuery, 
      (snapshot) => {
        try {
          const loadedStories = snapshot.docs.map(doc => {
            try {
              return formatStoryFromFirestore(doc);
            } catch (err) {
              console.error('Erreur lors du formatage d\'une histoire:', {
                docId: doc.id,
                error: err
              });
              return null;
            }
          }).filter((story): story is Story => story !== null);

          console.log('📥 Mise à jour des histoires:', {
            total: loadedStories.length,
            statuses: loadedStories.reduce((acc, story) => ({
              ...acc,
              [story.status]: (acc[story.status] || 0) + 1
            }), {} as Record<string, number>)
          });

          setStories(loadedStories);
          setError(null);
          setRetryCount(0);
        } catch (err) {
          console.error('Erreur lors du traitement des histoires:', err);
          setError(err instanceof Error ? err : new Error('Erreur inconnue'));
          
          if (retryCount < 3) {
            setRetryCount(prev => prev + 1);
          }
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erreur lors de l\'écoute des histoires:', {
          error: err,
          retryCount
        });
        setError(err);
        setIsLoading(false);

        if (retryCount < 3) {
          setRetryCount(prev => prev + 1);
        }
      }
    );

    return () => {
      console.log('🔄 Nettoyage du listener des histoires');
      unsubscribe();
    };
  }, [retryCount]);

  return { stories, isLoading, error };
};
