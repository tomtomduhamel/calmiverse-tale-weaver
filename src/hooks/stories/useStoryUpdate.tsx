
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useStoryCloudFunctions } from './useStoryCloudFunctions';
import { useToast } from "@/hooks/use-toast";

export const useStoryUpdate = () => {
  const { toast } = useToast();
  const { callCloudFunctionWithRetry } = useStoryCloudFunctions();

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
    updateStoryStatus,
    retryStoryGeneration
  };
};
