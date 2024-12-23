import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from "@/hooks/use-toast";
import type { Child } from "@/types/child";

export const useChildren = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const loadChildren = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'children'));
        const loadedChildren = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Child[];
        setChildren(loadedChildren);
      } catch (error) {
        console.error("Erreur lors du chargement des enfants:", error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les profils des enfants",
          variant: "destructive",
        });
      }
    };

    loadChildren();
  }, [toast]);

  const handleAddChild = async (childData: Omit<Child, "id">) => {
    try {
      const docRef = await addDoc(collection(db, 'children'), childData);
      const newChild: Child = {
        ...childData,
        id: docRef.id,
      };
      setChildren(prev => [...prev, newChild]);
      toast({
        title: "Succès",
        description: "Le profil a été ajouté avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'enfant:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le profil",
        variant: "destructive",
      });
    }
  };

  const handleUpdateChild = async (childId: string, updatedData: Omit<Child, "id">) => {
    try {
      const childRef = doc(db, 'children', childId);
      await updateDoc(childRef, updatedData);
      setChildren(prev => prev.map(child => 
        child.id === childId ? { ...updatedData, id: childId } : child
      ));
      toast({
        title: "Succès",
        description: "Le profil a été mis à jour avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'enfant:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le profil",
        variant: "destructive",
      });
    }
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await deleteDoc(doc(db, 'children', childId));
      setChildren(prev => prev.filter(child => child.id !== childId));
      toast({
        title: "Succès",
        description: "Le profil a été supprimé avec succès",
      });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'enfant:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le profil",
        variant: "destructive",
      });
    }
  };

  return {
    children,
    handleAddChild,
    handleUpdateChild,
    handleDeleteChild,
  };
};