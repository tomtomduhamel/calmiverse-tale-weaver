import { useState, useEffect } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addDocument, updateDocument, deleteDocument, getDocuments } from "@/lib/firebase-utils";

export interface StoryObjective {
  id: string;
  name: string;
  value: string;
}

export const useStoryObjectives = () => {
  const [objectives, setObjectives] = useState<StoryObjective[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "story_objectives"), (snapshot) => {
      const objectivesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StoryObjective[];
      setObjectives(objectivesData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addObjective = async (objective: Omit<StoryObjective, "id">) => {
    return await addDocument("story_objectives", objective);
  };

  const updateObjective = async (id: string, objective: Partial<StoryObjective>) => {
    await updateDocument("story_objectives", id, objective);
  };

  const deleteObjective = async (id: string) => {
    await deleteDocument("story_objectives", id);
  };

  return {
    objectives,
    isLoading,
    addObjective,
    updateObjective,
    deleteObjective
  };
};