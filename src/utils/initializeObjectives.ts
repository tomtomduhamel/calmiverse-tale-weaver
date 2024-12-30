import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addDocument } from "@/lib/firebase-utils";

export const initializeObjectives = async () => {
  try {
    // Supprime d'abord tous les documents existants
    const querySnapshot = await getDocs(collection(db, 'story_objectives'));
    const deletePromises = querySnapshot.docs.map(doc => 
      deleteDoc(doc.ref)
    );
    await Promise.all(deletePromises);
    
    console.log("Anciens objectifs supprimés avec succès");

    const objectives = [
      {
        name: "Aider à s'endormir",
        value: "sleep",
        label: "Aider à s'endormir"
      },
      {
        name: "Se concentrer",
        value: "focus",
        label: "Se concentrer"
      },
      {
        name: "Se détendre",
        value: "relax",
        label: "Se détendre"
      },
      {
        name: "S'amuser",
        value: "fun",
        label: "S'amuser"
      }
    ];

    // Ajoute les nouveaux objectifs
    for (const objective of objectives) {
      await addDocument("story_objectives", objective);
    }

    console.log("Nouveaux objectifs initialisés avec succès:", objectives);
  } catch (error) {
    console.error("Erreur lors de l'initialisation des objectifs:", error);
    throw error;
  }
};