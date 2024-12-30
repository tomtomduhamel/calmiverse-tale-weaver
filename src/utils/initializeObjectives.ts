import { addDocument } from "@/lib/firebase-utils";

export const initializeObjectives = async () => {
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

  // Supprime tous les anciens objectifs et ajoute les nouveaux
  for (const objective of objectives) {
    await addDocument("story_objectives", objective);
  }

  console.log("Objectifs initialisés avec succès:", objectives);
};