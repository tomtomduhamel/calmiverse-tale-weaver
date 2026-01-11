/**
 * Utilitaires pour le remplacement des variables dans les templates de prompts
 */

export interface PromptVariables {
  // Variables communes
  children_names?: string;
  children_context?: string;
  objective?: string;
  objective_description?: string;
  vocabulary_level?: string;
  target_word_count?: string | number;
  
  // Variables spécifiques création d'histoire
  selected_title?: string;
  duration_minutes?: string | number;
  
  // Variables spécifiques suites d'histoires
  previous_story_title?: string;
  previous_story_summary?: string;
  previous_story_content?: string;
  characters?: string;
  tome_number?: string | number;
  sequel_instructions?: string;
  
  // Variables dynamiques supplémentaires
  [key: string]: string | number | undefined;
}

/**
 * Remplace les variables {{variable}} dans un template par leurs valeurs
 * 
 * @param template - Le template avec les variables à remplacer
 * @param variables - Les valeurs des variables
 * @returns Le template avec les variables remplacées
 */
export const replacePromptVariables = (
  template: string,
  variables: PromptVariables
): string => {
  if (!template) return "";
  
  let result = template;
  
  // Remplacer toutes les variables {{key}}
  Object.entries(variables).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      result = result.replace(regex, String(value));
    }
  });
  
  // Nettoyer les variables non remplacées (optionnel: les laisser vides)
  result = result.replace(/\{\{[^}]+\}\}/g, "");
  
  return result;
};

/**
 * Vérifie si un template contient des variables non remplacées
 */
export const hasUnreplacedVariables = (template: string): boolean => {
  return /\{\{[^}]+\}\}/.test(template);
};

/**
 * Extrait toutes les variables d'un template
 */
export const extractVariables = (template: string): string[] => {
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  
  return matches.map((match) => match.replace(/\{\{|\}\}/g, ""));
};

/**
 * Mapping des objectifs vers leurs descriptions
 */
export const OBJECTIVE_DESCRIPTIONS: Record<string, string> = {
  sleep: "Aider à s'endormir de manière apaisante et régénératrice",
  focus: "Améliorer la concentration et l'attention",
  relax: "Favoriser la détente et la relaxation",
  fun: "S'amuser et passer un bon moment",
};

/**
 * Génère les instructions de vocabulaire selon l'âge
 */
export const getVocabularyInstructions = (youngestAge: number): string => {
  if (youngestAge <= 3) {
    return "Utilise un vocabulaire très simple avec des mots familiers et quelques onomatopées.";
  } else if (youngestAge <= 5) {
    return "Utilise un vocabulaire simple et accessible. Évite les mots complexes.";
  } else if (youngestAge <= 7) {
    return "Utilise un vocabulaire adapté aux enfants d'âge scolaire. Introduis quelques mots nouveaux avec contexte.";
  } else {
    return "Utilise un vocabulaire plus riche et varié. Peux introduire des concepts plus complexes.";
  }
};
