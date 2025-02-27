
import { collection, addDoc, deleteDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth, functions } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { createStoryData } from './storyFormatters';
import { httpsCallable } from 'firebase/functions';

export const useStoryMutations = () => {
  const { toast } = useToast();
  
  const MAX_RETRY_ATTEMPTS = 2; // Reduced retry attempts
  const RETRY_DELAY = 3000; // Increased delay between retries

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const callCloudFunctionWithRetry = async (functionName: string, data: any, attempt = 0): Promise<any> => {
    try {
      console.log(`Calling cloud function '${functionName}' (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS + 1})`, data);
      const cloudFunction = httpsCallable(functions, functionName);
      const result = await cloudFunction(data);
      console.log(`Cloud function '${functionName}' executed successfully`, result);
      
      // Dispatch success notification
      const successEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'success',
          title: 'Génération réussie',
          message: 'Votre histoire a été générée avec succès'
        }
      });
      document.dispatchEvent(successEvent);
      
      return result.data;
    } catch (error: any) {
      console.error(`Error calling cloud function '${functionName}':`, error);
      
      // Extract detailed error message if available
      let errorMessage = "Une erreur est survenue lors de l'appel à la fonction cloud";
      
      if (error.message) {
        errorMessage = error.message;
        
        // Try to parse JSON error message
        try {
          const parsedError = JSON.parse(error.message);
          if (parsedError.message) {
            errorMessage = parsedError.message;
          }
        } catch (parseError) {
          // Not a JSON string, use the error message as is
        }
      } else if (error.details) {
        errorMessage = typeof error.details === 'string' 
          ? error.details 
          : JSON.stringify(error.details);
      }
      
      // Special handling for specific error types
      if (errorMessage.includes('Secret Manager') || errorMessage.includes('API key')) {
        errorMessage = "Problème de configuration du serveur. Veuillez contacter l'administrateur.";
      }
      
      if (attempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying cloud function '${functionName}' in ${RETRY_DELAY}ms... (${attempt + 1}/${MAX_RETRY_ATTEMPTS})`);
        
        // Show retry notification
        toast({
          title: "Nouvelle tentative",
          description: `Tentative ${attempt + 1}/${MAX_RETRY_ATTEMPTS} de génération...`,
        });
        
        await sleep(RETRY_DELAY * (attempt + 1)); // Exponential backoff
        return callCloudFunctionWithRetry(functionName, data, attempt + 1);
      }
      
      // If we've exhausted retries, throw a user-friendly error
      const finalErrorMessage = `Impossible de générer l'histoire après plusieurs tentatives. ${errorMessage}`;
      console.error("Final error after retries:", finalErrorMessage);
      
      // Dispatch final error notification
      const errorEvent = new CustomEvent('app-notification', {
        detail: {
          type: 'error',
          title: 'Échec de la génération',
          message: finalErrorMessage
        }
      });
      document.dispatchEvent(errorEvent);
      
      throw new Error(finalErrorMessage);
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

  const updateStoryStatus = async (storyId: string, status: 'pending' | 'completed' | 'read' | 'error', errorDetails?: string) => {
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
        
        const updateData: any = {
          status,
          _version: (currentData._version || 1) + 1,
          _lastSync: serverTimestamp(),
          _pendingWrites: false,
          updatedAt: serverTimestamp()
        };
        
        // Add error details if provided
        if (status === 'error' && errorDetails) {
          updateData.error = errorDetails;
        } else if (status !== 'error' && currentData.error) {
          // Clear error field if status is no longer error
          updateData.error = null;
        }
        
        transaction.update(storyRef, updateData);
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

  const retryStoryGeneration = async (storyId: string) => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log(`Retrying story generation for: ${storyId}`);
      // Update story status to pending
      await updateStoryStatus(storyId, 'pending');
      
      // Call the retry function
      const result = await callCloudFunctionWithRetry('retryFailedStory', { storyId });
      
      console.log('Story retry request successful:', result);
      toast({
        title: "Nouvelle tentative",
        description: "La génération de l'histoire a été relancée",
      });
      
      return result;
    } catch (error) {
      console.error('Error retrying story generation:', error);
      
      // Update story status back to error
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry story generation';
      await updateStoryStatus(storyId, 'error', errorMessage);
      
      toast({
        title: "Erreur",
        description: "La nouvelle tentative a échoué: " + errorMessage,
        variant: "destructive",
      });
      
      throw error;
    }
  };

  return {
    createStory,
    updateStoryStatus,
    deleteStory,
    retryStoryGeneration,
  };
};
