/**
 * Translations from technical objective values to French labels
 */
export const objectiveTranslations: Record<string, string> = {
  // Objectifs principaux (correspondant aux choix initiaux de l'utilisateur)
  'sleep': 'Endormissement',
  'focus': 'Concentration',
  'relax': 'Relaxation',
  'fun': 'Amusement',
  
  // Sleep-related objectives
  'bedtime': 'Histoire du coucher',
  'calm': 'Histoire apaisante',
  'relaxation': 'Histoire de relaxation',
  
  // Fun and entertainment
  'adventure': 'Histoire d\'aventure',
  'magic': 'Histoire magique',
  'fantasy': 'Histoire fantastique',
  
  // Learning objectives
  'learning': 'Histoire éducative',
  'friendship': 'Histoire sur l\'amitié',
  'courage': 'Histoire sur le courage',
  'kindness': 'Histoire sur la gentillesse',
  'sharing': 'Histoire sur le partage',
  'honesty': 'Histoire sur l\'honnêteté',
  
  // Emotional objectives
  'confidence': 'Histoire pour la confiance en soi',
  'fears': 'Histoire pour surmonter les peurs',
  'emotions': 'Histoire sur les émotions',
  'self-esteem': 'Histoire pour l\'estime de soi',
  
  // Special occasions
  'birthday': 'Histoire d\'anniversaire',
  'christmas': 'Histoire de Noël',
  'halloween': 'Histoire d\'Halloween',
  'easter': 'Histoire de Pâques',
  
  // Family values
  'family': 'Histoire de famille',
  'love': 'Histoire d\'amour',
  'respect': 'Histoire sur le respect',
  'responsibility': 'Histoire sur la responsabilité'
};

/**
 * Converts a technical objective value to its French label
 */
export function translateObjective(objective: string | { name?: string; value?: string } | undefined): string {
  if (!objective) return '';
  
  let technicalValue: string;
  
  if (typeof objective === 'string') {
    technicalValue = objective.toLowerCase();
  } else if (typeof objective === 'object') {
    technicalValue = (objective.value || objective.name || '').toLowerCase();
  } else {
    return '';
  }
  
  // Return the French translation or the original value if no translation exists
  return objectiveTranslations[technicalValue] || technicalValue;
}

/**
 * Cleans a title by removing timestamps and fixing formatting
 */
export function cleanEpubTitle(title: string): string {
  return title
    // Remove timestamp numbers at the beginning (e.g., "1234567890_")
    .replace(/^\d+_/, '')
    // Replace underscores with spaces
    .replace(/_/g, ' ')
    // Clean up multiple spaces
    .replace(/\s+/g, ' ')
    // Trim
    .trim();
}

/**
 * Generates a clean filename for EPUB (without timestamp for internal use)
 */
export function generateCleanFilename(title: string): string {
  return title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50)
    .trim();
}

/**
 * Formats a title according to French capitalization rules
 * Only capitalize the first letter and proper nouns
 */
export function formatFrenchTitle(title: string): string {
  if (!title) return '';
  
  const words = title.toLowerCase().split(' ');
  
  // List of articles, prepositions and conjunctions that should stay lowercase
  const lowercaseWords = [
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'à', 'au', 'aux',
    'dans', 'sur', 'avec', 'pour', 'par', 'sans', 'sous', 'vers', 'chez', 'entre',
    'jusqu', 'depuis', 'pendant', 'avant', 'après', 'mais', 'car', 'donc', 'or', 'ni'
  ];
  
  return words.map((word, index) => {
    // Always capitalize the first word
    if (index === 0) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }
    
    // Keep lowercase words lowercase unless they're proper nouns
    if (lowercaseWords.includes(word.toLowerCase())) {
      return word.toLowerCase();
    }
    
    // Capitalize other words (potential proper nouns or important words)
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

/**
 * Utility to translate technical objective keys into poetic, user-friendly labels for the Gamification Dashboard.
 */
export const getPoeticObjectiveName = (key: string | null | undefined): string => {
  if (!key) return "Voyage inconnu";

  const lowerKey = key.toLowerCase();

  const poeticTranslations: Record<string, string> = {
    "custom": "Aventures sur mesure",
    "fast_story_anger": "Colères apaisées",
    "fast_story_sadness": "Chagrins consolés",
    "fast_story_fear": "Craintes envolées",
    "fast_story_joy": "Éclats de joie",
    "fast_story_disgust": "Découvertes sereines",
    "fast_story_surprise": "Surprises émerveillées",
    "fast_story_situation_anger": "Colères apaisées",
    "fast_story_situation_sadness": "Chagrins consolés",
    "fast_story_situation_fear": "Craintes envolées",
    "s'endormir": "Nuits douces",
    "se détendre": "Bulles de sérénité",
    "se concentrer": "Bulles de concentration",
    "s'amuser": "Éclats de rire",
    "fun": "Éclats de rire",
    "apprendre": "Petites découvertes",
    "gérer ses émotions": "Cœurs apaisés"
  };

  if (poeticTranslations[lowerKey]) {
    return poeticTranslations[lowerKey];
  }

  // Fallback pattern matching
  if (lowerKey.includes("anger")) return "Colères apaisées";
  if (lowerKey.includes("sadness") || lowerKey.includes("sad")) return "Chagrins consolés";
  if (lowerKey.includes("fear")) return "Craintes envolées";
  if (lowerKey.includes("joy") || lowerKey.includes("fun")) return "Éclats de joie";

  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
};