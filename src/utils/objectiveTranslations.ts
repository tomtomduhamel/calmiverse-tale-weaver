/**
 * Translations from technical objective values to French labels
 */
export const objectiveTranslations: Record<string, string> = {
  // Objectifs principaux (correspondant aux choix initiaux de l'utilisateur)
  'sleep': 'Aider à s\'endormir',
  'focus': 'Se concentrer',
  'relax': 'Se détendre',
  'fun': 'S\'amuser',
  
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