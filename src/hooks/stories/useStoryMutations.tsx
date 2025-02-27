import { collection, addDoc, deleteDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth, functions } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { createStoryData } from './storyFormatters';
import { httpsCallable } from 'firebase/functions';

export const useStoryMutations = () => {
  const { toast } = useToast();
  
  const MAX_RETRY_ATTEMPTS = 2;
  const RETRY_DELAY = 1000;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const callCloudFunctionWithRetry = async (functionName: string, data: any, attempt = 0): Promise<any> => {
    try {
      console.log(`Calling cloud function '${functionName}' (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1})`, data);
      const cloudFunction = httpsCallable(functions, functionName);
      const result = await cloudFunction(data);
      console.log(`Cloud function '${functionName}' executed successfully`, result);
      return result;
    } catch (error) {
      console.error(`Error calling cloud function '${functionName}':`, error);
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying cloud function '${functionName}' in ${RETRY_DELAY}ms...`);
        await sleep(RETRY_DELAY);
        return callCloudFunctionWithRetry(functionName, data, attempt + 1);
      }
      
      throw error;
    }
  };

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
      
      callCloudFunctionWithRetry('generateStory', {
        storyId: storyId,
        objective: formData.objective,
        childrenNames: childrenNames
      })
        .then(() => {
          console.log('Story generation completed for story ID:', storyId);
        })
        .catch(error => {
          console.error('Failed to generate story:', error);
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

  const updateStoryStatus = async (storyId: string, status: 'pending' | 'completed' | 'read' | 'error') => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Updating story status: ${storyId} -> ${status}`);
      
      await runTransaction(db, async (transaction) => {
        const storyRef = doc(db, 'stories', storyId);
        const storyDoc = await transaction.get(storyRef);

        if (!storyDoc.exists()) {
          throw new Error('Histoire non trouvée');
        }

        const currentData = storyDoc.data();
        
        transaction.update(storyRef, {
          status,
          _version: (currentData._version || 1) + 1,
          _lastSync: serverTimestamp(),
          _pendingWrites: false,
          updatedAt: serverTimestamp()
        });
      });

      console.log('✅ Story status updated successfully:', {
        id: storyId,
        newStatus: status
      });
    } catch (error) {
      console.error('❌ Error updating story status:', error);
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Deleting story: ${storyId}`);
      const storyRef = doc(db, 'stories', storyId);
      await deleteDoc(storyRef);
      
      console.log('Story deleted successfully');
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error) {
      console.error('Error deleting story:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  return {
    createStory,
    updateStoryStatus,
    deleteStory,
  };
};
