import { addDocument } from "@/lib/firebase-utils";

export const initializeObjectives = async () => {
  const objectives = [
    {
      name: "accompagner dans le sommeil",
      value: "sleep"
    },
    {
      name: "se relaxer",
      value: "relax"
    },
    {
      name: "créer un moment de concentration",
      value: "focus"
    }
  ];

  for (const objective of objectives) {
    await addDocument("story_objectives", objective);
  }
};