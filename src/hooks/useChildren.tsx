import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";

export const useChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const childrenCollection = collection(db, 'children');
    const unsubscribe = onSnapshot(childrenCollection, 
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

    return () => unsubscribe();
  }, [toast]);

  const handleAddChild = async (childData: Omit<Child, "id">) => {
    try {
      console.log("Tentative de création d'un enfant avec les données:", childData);
      const docRef = await addDoc(collection(db, 'children'), childData);
      console.log("Enfant créé avec succès, ID:", docRef.id);
      return docRef.id;
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'enfant:", error);
      throw error;
    }
  };

  const handleUpdateChild = async (childId: string, updatedData: Omit<Child, "id">) => {
    try {
      const childRef = doc(db, 'children', childId);
      await updateDoc(childRef, updatedData);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'enfant:", error);
      throw error;
    }
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteDoc(doc(db, 'children', childId));
    } catch (error) {
      console.error("Erreur lors de la suppression de l'enfant:", error);
      throw error;
    }
  };

  return {
    children,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
  };
};