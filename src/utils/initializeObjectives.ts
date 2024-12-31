import { collection, getDocs, deleteDoc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

export const initializeObjectives = async () => {
  try {
    // Récupération de la référence à la collection
    const objectivesCollection = collection(db, 'story_objectives');
    
    // Suppression des anciens objectifs
    const querySnapshot = await getDocs(objectivesCollection);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Ajout des nouveaux objectifs
    const addPromises = objectives.map(objective => 
      addDoc(objectivesCollection, objective)
    );
    await Promise.all(addPromises);
    
    return true;
  } catch (error) {
    // Création d'une erreur simple et clonable
    const simpleError = new Error('Erreur lors de l\'initialisation des objectifs');
    simpleError.name = 'InitializationError';
    throw simpleError;
  }
};