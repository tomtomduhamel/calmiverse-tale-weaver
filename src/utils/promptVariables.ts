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
  
  // Variables narratives (sélection aléatoire depuis la DB)
  narrative_schema?: string;
  narrative_mechanism?: string;
  vakog_focus?: string;
  vakog_keywords?: string;
  symbolic_universe?: string;
  symbolic_description?: string;
  symbolic_visual_style?: string;
  ericksonian_technique?: string;
  ericksonian_pattern?: string;
  age_characteristics?: string;
  age_preferred_supports?: string;
  
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
  focus: "Améliorer la concentration, la curiosité et l'esprit de déduction",
  relax: "Favoriser la détente, la sérénité et le lâcher-prise",
  fun: "S'amuser, rire et passer un moment plein d'énergie joyeuse",
};

/**
 * Génère les instructions de vocabulaire selon l'âge
 */
export const getVocabularyInstructions = (youngestAge: number): string => {
  const onomatopoeiaRule = "- RÈGLE DES ONOMATOPÉES : Maximum 3 onomatopées dans TOUTE l'histoire (ex: Hop !, Plouf !, Chut...).";
  const metaphorRule = "- RÈGLE ZÉRO MÉTAPHORE SUPERFLUE : Maximum 1 à 2 comparaisons physiques simples dans toute l'histoire (ex: 'un ballon gros comme une pastèque'). INTERDICTION FORMELLE des comparaisons poétiques lentes ('comme du miel', 'comme une onde', 'comme une offrande', 'comme un pli dans le ciel'). Raconter l'action avec des verbes directs et vivants.";
  const blacklistRule = "- LISTE NOIRE STRICTE (MOTS PROSCRITS) : Ne JAMAIS utiliser les mots suivants : 'irisé', 'nacre', 'nacré', 'diaphane', 'béatitude', 'onde', 'offrande', 'cérémonieux', 'cérémonieuse', 'murmure machinal', 'alcôve', 'zéphyr', 'lueur feutrée', 'contemplation', 'indicible'.";

  if (youngestAge <= 3) {
    return `- VOCABULAIRE TOUT-PETITS (0-3 ans) : Phrases très courtes (Sujet + Verbe + Complément). Mots simples et concrets du quotidien direct (doudou, chat, pomme, bain, dodo, ballon). Interdiction totale du vocabulaire abstrait ou littéraire.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 5) {
    return `- VOCABULAIRE MATERNELLE (4-6 ans) : Vocabulaire simple, vivant, concret et chaleureux. Verbes d'action directs (courir, grimper, cacher, rire, attraper). Aucun terme pompeux ou complexe.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 7) {
    return `- VOCABULAIRE PRIMAIRE (7-8 ans) : Vocabulaire adapté à l'école primaire. Maximum 2 à 3 mots enrichissants immédiatement compréhensibles en contexte. Syntaxe claire et vivante.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else if (youngestAge <= 12) {
    return `- VOCABULAIRE JUNIOR (8-12 ans) : Vocabulaire riche mais fluide et accessible. Dialogues rythmés, esprit vif, sans tournures artificiellement vieillottes.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  } else {
    return `- VOCABULAIRE ADO (13+ ans) : Vocabulaire précis et dynamique. Dialogues modernes avec autodérision bienveillante et maturité, sans infantilisation.\n${metaphorRule}\n${blacklistRule}\n${onomatopoeiaRule}`;
  }
};
