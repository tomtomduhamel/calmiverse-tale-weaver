
import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, where, orderBy, initializeFirestore, enableIndexedDbPersistence, CACHE_SIZE_UNLIMITED } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import type { Story } from '@/types/story';
import { formatStoryFromFirestore } from './storyFormatters';
import { useToast } from "@/hooks/use-toast";

// Initialize Firestore with improved settings
const enhancedDb = initializeFirestore(db.app, {
  experimentalForceLongPolling: true,
  cacheSizeBytes: CACHE_SIZE_UNLIMITED
});

// Enable offline persistence
enableIndexedDbPersistence(enhancedDb).catch((err) => {
  console.error("Erreur lors de l'activation de la persistence:", err);
});

export const useStoriesQuery = () => {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('Pas d\'utilisateur connecté');
      setIsLoading(false);
      return;
    }

    console.log('Initialisation de la requête Firestore:', {
      userId: auth.currentUser.uid
    });

    setIsLoading(true);

    const storiesQuery = query(
      collection(enhancedDb, 'stories'),
      where('authorId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      storiesQuery,
      { includeMetadataChanges: true },
      (snapshot) => {
        try {
          console.log('Réception mise à jour Firestore:', {
            numberOfDocs: snapshot.docs.length,
            fromCache: snapshot.metadata.fromCache,
            hasPendingWrites: snapshot.metadata.hasPendingWrites
          });

          if (!snapshot.metadata.hasPendingWrites) {
            const loadedStories = snapshot.docs.map(doc => {
              try {
                return formatStoryFromFirestore(doc);
              } catch (err) {
                console.error('Erreur formatage histoire:', {
                  docId: doc.id,
                  error: err
                });
                return null;
              }
            }).filter((story): story is Story => story !== null);

            console.log('Stories chargées:', {
              total: loadedStories.length,
              statuses: loadedStories.reduce((acc, story) => ({
                ...acc,
                [story.status]: (acc[story.status] || 0) + 1
              }), {} as Record<string, number>)
            });

            setStories(loadedStories);
            setError(null);
          }
        } catch (err) {
          console.error('Erreur traitement données:', err);
          setError(err instanceof Error ? err : new Error('Erreur inconnue'));
          toast({
            title: "Erreur de synchronisation",
            description: "Une erreur est survenue lors de la synchronisation des histoires",
            variant: "destructive",
          });
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('Erreur listener Firestore:', err);
        setError(err);
        setIsLoading(false);
        toast({
          title: "Erreur de connexion",
          description: "Impossible de se connecter à la base de données",
          variant: "destructive",
        });
      }
    );

    return () => {
      console.log('Nettoyage listener Firestore');
      unsubscribe();
    };
  }, [toast]);

  return { stories, isLoading, error };
};
