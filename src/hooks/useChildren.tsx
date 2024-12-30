import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";

export const useChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const childrenQuery = query(collection(db, 'children'));
    let unsubscribe: () => void;

    const setupSubscription = async () => {
      try {
        unsubscribe = onSnapshot(childrenQuery, 
          (snapshot) => {
            const loadedChildren = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            })) as Child[];
            setChildren(loadedChildren);
          },
          (error) => {
            console.error("Erreur lors de l'écoute des enfants:", error);
            toast({
              title: "Erreur",
              description: "Impossible de charger les profils des enfants en temps réel",
              variant: "destructive",
            });
          }
        );
      } catch (error) {
        console.error("Erreur lors de la configuration de l'écoute:", error);
      }
    };

    setupSubscription();
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [toast]);

  const handleAddChild = useCallback(async (childData: Omit<Child, "id">) => {
    try {
      console.log("Tentative de création d'un enfant avec les données:", childData);
      const docRef = await addDoc(collection(db, 'children'), childData);
      console.log("Enfant créé avec succès, ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'enfant:", error);
      throw error;
    }
  }, []);

  const handleUpdateChild = useCallback(async (childId: string, updatedData: Partial<Child>) => {
    try {
      const childRef = doc(db, 'children', childId);
      await updateDoc(childRef, updatedData);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'enfant:", error);
      throw error;
    }
  }, []);

  const handleDeleteChild = useCallback(async (childId: string) => {
    try {
      await deleteDoc(doc(db, 'children', childId));
    } catch (error) {
      console.error("Erreur lors de la suppression de l'enfant:", error);
      throw error;
    }
  }, []);

  return {
    children,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
  };
};