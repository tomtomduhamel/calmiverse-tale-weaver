
import { useToast } from "@/hooks/use-toast";

// Objectifs prédéfinis pour les histoires
const DEFAULT_OBJECTIVES = [
  { id: "sleep", label: "Aider à s'endormir", value: "sleep" },
  { id: "focus", label: "Se concentrer", value: "focus" },
  { id: "relax", label: "Se détendre", value: "relax" },
  { id: "fun", label: "S'amuser", value: "fun" }
];

export const initializeObjectives = () => {
  // Cette fonction ne fait rien pour l'instant
  // À l'avenir, elle pourrait initialiser les objectifs dans la base de données
  console.log("Initialisation des objectifs d'histoires");
  return DEFAULT_OBJECTIVES;
};
