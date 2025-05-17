
// Fonction de vérification des valeurs d'entrée
export const validateInput = (storyId: string, objective: string, childrenNames: string[]) => {
  if (!storyId) {
    throw new Error("ID d'histoire manquant");
  }
  
  if (!objective) {
    throw new Error("Objectif de l'histoire manquant");
  }
  
  if (!childrenNames || !Array.isArray(childrenNames) || childrenNames.length === 0) {
    throw new Error("Noms des enfants manquants ou invalides");
  }
};
