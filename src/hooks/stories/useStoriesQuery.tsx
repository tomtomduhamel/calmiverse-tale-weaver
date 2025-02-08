
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
          const loadedStories = snapshot.docs.map(doc => {
            try {
              const formattedStory = formatStoryFromFirestore(doc);
              console.log('Histoire formatée:', {
                id: formattedStory.id,
                id_stories: formattedStory.id_stories,
                status: formattedStory.status,
                hasStoryText: Boolean(formattedStory.story_text?.trim()),
              });
              return formattedStory;
            } catch (err) {
              console.error('Erreur lors du formatage d\'une histoire:', err, 'Document:', doc.id);
              return null;
            }
          }).filter((story): story is Story => {
            if (!story) return false;

            // Validation approfondie du statut et du contenu
            const isValidStatus = story.status === 'completed' || 
                                story.status === 'pending' || 
                                story.status === 'read';

            const hasValidContent = story.status === 'completed' ? 
                                  Boolean(story.story_text?.trim()) : 
                                  true;

            if (!isValidStatus || !hasValidContent) {
              console.warn('Histoire invalide détectée:', {
                id: story.id,
                status: story.status,
                hasContent: Boolean(story.story_text?.trim())
              });
              return false;
            }

            return true;
          });

          console.log('📥 Histoires validées et filtrées:', loadedStories.length);
          setStories(loadedStories);
          setError(null);
        } catch (err) {
          console.error('Erreur lors du traitement des histoires:', err);
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
