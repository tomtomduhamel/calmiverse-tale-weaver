
import { stripStoryEmotionTags } from './storyContentFormatter';

// Constante de vitesse de lecture alignée avec la vitesse "Tortue" (Normal) du ReadingSpeedSelector
// Cette valeur correspond à une lecture douce et expressive d'un parent à son enfant (~120 mots/min)
export const READING_SPEED_WPM = 120;

/**
 * Calcule le temps de lecture estimé pour un parent lisant une histoire.
 * Inclut le tilde '~' pour marquer la nature estimative et bienveillante du temps de lecture.
 */
export const calculateReadingTime = (text: string | undefined): string => {
  if (!text) {
    return "0 min de lecture";
  }

  // Nettoyer les éventuelles balises d'émotions audio avant de compter les mots
  const cleanText = stripStoryEmotionTags(text);
  if (!cleanText) {
    return "0 min de lecture";
  }

  // Vitesse de lecture adaptée aux enfants, alignée avec estimateWordCountForDuration
  const wordCount = cleanText.trim().split(/\s+/).length;
  const minutes = Math.round(wordCount / READING_SPEED_WPM);

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
