
import { collection, addDoc, deleteDoc, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import { createStoryData } from './storyFormatters';

export const useStoryMutations = () => {
  const { toast } = useToast();

  const createStory = async (formData: { childrenIds: string[], objective: string }, children: any[] = []) => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      console.log('🚀 Début du processus de création d\'histoire...', {
        formData,
        currentUser: auth.currentUser.uid
      });
      
      const selectedChildren = children.filter(child => formData.childrenIds.includes(child.id));
      const childrenNames = selectedChildren.map(child => child.name);
      
      const storyData = {
        ...createStoryData(formData, childrenNames),
        authorId: auth.currentUser.uid,
        _version: 1,
        _lastSync: serverTimestamp(),
        _pendingWrites: true
      };

      console.log('📝 Préparation à la sauvegarde de l\'histoire:', {
        authorId: storyData.authorId,
        status: storyData.status,
        version: storyData._version
      });
      
      // Création atomique avec transaction
      const docRef = await addDoc(collection(db, 'stories'), storyData);
      
      console.log('✅ Histoire créée avec succès:', {
        id: docRef.id,
        authorId: storyData.authorId,
        version: storyData._version
      });

      // Mise à jour immédiate du statut dans l'UI
      toast({
        title: "Succès",
        description: "L'histoire est en cours de génération",
      });

      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur lors de la création de l\'histoire:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer l'histoire",
        variant: "destructive",
      });
      throw error;
    }
  };

  const updateStoryStatus = async (storyId: string, status: 'pending' | 'completed' | 'read') => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
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

      console.log('✅ Statut de l\'histoire mis à jour avec succès:', {
        id: storyId,
        newStatus: status
      });
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour du statut:', error);
      throw error;
    }
  };

  const deleteStory = async (storyId: string) => {
    if (!auth.currentUser) {
      throw new Error("Utilisateur non connecté");
    }

    try {
      const storyRef = doc(db, 'stories', storyId);
      await deleteDoc(storyRef);
      toast({
        title: "Succès",
        description: "L'histoire a été supprimée",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'histoire:', error);
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
