
import { collection, addDoc, runTransaction, serverTimestamp, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { createStoryData } from './storyFormatters';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';

export const useStoryCreation = () => {
  const { toast } = useToast();
  const { callCloudFunctionWithRetry } = useStoryCloudFunctions();

  const createStory = async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('🚀 Starting story creation process...', {
        formData,
        currentUser: auth.currentUser.uid
      });
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      console.log('Selected children for story:', childrenNames);
      
      if (!formData.objective) {
        throw new Error("L'objectif de l'histoire est obligatoire");
      }
      
      if (childrenNames.length === 0) {
        throw new Error("Veuillez sélectionner au moins un enfant pour créer une histoire");
      }
      
      const storyData = {
        ...createStoryData(formData, childrenNames),
        authorId: auth.currentUser.uid,
        _version: 1,
        _lastSync: serverTimestamp(),
        _pendingWrites: true
      };

      console.log('Creating initial story document with pending status');
      const docRef = await addDoc(collection(db, 'stories'), storyData);
      const storyId = docRef.id;
      
      console.log('Initial story document created with ID:', storyId);
      
      console.log('Triggering story generation cloud function');
      
      // Show initial toast before calling the function
      toast({
        title: "Génération en cours",
        description: "Nous commençons à générer votre histoire, merci de patienter...",
      });
      
      // Call the cloud function asynchronously
      callCloudFunctionWithRetry('generateStory', {
        storyId: storyId,
        objective: formData.objective,
        childrenNames: childrenNames
      })
        .then(() => {
          console.log('Story generation completed for story ID:', storyId);
          toast({
            title: "Histoire générée",
            description: "Votre histoire est maintenant disponible dans votre bibliothèque.",
          });
        })
        .catch(error => {
          console.error('Failed to generate story:', error);
          
          // Update story document with error status
          runTransaction(db, async (transaction) => {
            const storyRef = doc(db, 'stories', storyId);
            transaction.update(storyRef, {
              status: 'error',
              error: error instanceof Error ? error.message : 'Story generation failed',
              updatedAt: serverTimestamp()
            });
          }).catch(err => {
            console.error('Failed to update story status to error:', err);
          });
          
          // Show error toast
          toast({
            title: "Erreur de génération",
            description: error instanceof Error ? error.message : "La génération de l'histoire a échoué",
            variant: "destructive",
          });
        });
      
      return storyId;
    } catch (error) {
      console.error('❌ Error during story creation:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error 
          ? error.message 
          : "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createStory
  };
};
