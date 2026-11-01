
import { stripStoryEmotionTags } from './storyContentFormatter';

// Constante de vitesse de lecture alignée avec la vitesse "Tortue" (Normal) du ReadingSpeedSelector
// Cette valeur correspond à une lecture douce et expressive d'un parent à son enfant (~120 mots/min)
export const READING_SPEED_WPM = 120;

/**
 * Calcule le temps de lecture estimé pour un parent lisant une histoire.
 * Inclut le tilde '~' pour marquer la nature estimative et bienveillante du temps de lecture.
 * @param text Le texte de l'histoire
 * @param customWpm Vitesse personnalisée en mots par minute (défaut 120)
 */
export const calculateReadingTime = (text: string | undefined, customWpm?: number): string => {
  if (!text) {
    return "0 min de lecture";
  }

  // Nettoyer les éventuelles balises d'émotions audio avant de compter les mots
  const cleanText = stripStoryEmotionTags(text);
  if (!cleanText) {
    return "0 min de lecture";
  }

  const wpm = customWpm && customWpm >= 50 && customWpm <= 300 ? customWpm : READING_SPEED_WPM;

  // Vitesse de lecture adaptée aux enfants, alignée avec estimateWordCountForDuration
  const wordCount = cleanText.trim().split(/\s+/).length;
  let minutes = Math.round(wordCount / wpm);

  // Sécurité d'arrondi et d'affichage : éviter qu'une histoire express (3 min) ne s'affiche à 4 ou 5 min
  // Si le nombre de mots est dans la tranche express (<= 360 mots), la durée perçue ne doit pas dépasser 3 min
  if (wordCount <= 360 && minutes > 3) {
    minutes = 3;
  } else if (wordCount <= 600 && minutes > 5) {
    minutes = 5;
  } else if (wordCount <= 1180 && minutes > 10) {
    minutes = 10;
  }

  if (minutes < 1) {
    return "< 1 min de lecture";
  }

  return `~${minutes} min de lecture`;
};

/**
 * Formate une durée en minutes en texte de lecture parent explicite
 */
export const formatReadingMinutes = (minutes: number): string => {
  if (minutes < 1) return "< 1 min de lecture";
  return `~${minutes} min de lecture`;
};

/**
 * Formate une durée audio en secondes en texte convivial d'écoute
 */
export const formatAudioDuration = (seconds: number): string => {
  if (!seconds || seconds <= 0) return "0 min d'écoute";
  const mins = Math.floor(seconds / 60);
  const remainingSecs = Math.round(seconds % 60);
  
  if (mins < 1) {
    return `${remainingSecs}s d'écoute`;
  }
  if (remainingSecs === 0) {
    return `${mins} min d'écoute`;
  }
  return `${mins} min ${remainingSecs}s d'écoute`;
};
