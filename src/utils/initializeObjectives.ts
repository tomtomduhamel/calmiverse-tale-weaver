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
    const objectivesCollection = collection(db, 'story_objectives');
    const snapshot = await getDocs(objectivesCollection);
    
    // Only initialize if collection is empty
    if (snapshot.empty) {
      const addPromises = objectives.map(objective => 
        addDoc(objectivesCollection, objective)
      );
      await Promise.all(addPromises);
    }
    
    return true;
  } catch (error) {
    console.error("Failed to initialize objectives");
    return false;
  }
};