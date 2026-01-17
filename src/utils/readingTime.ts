
// Constante de vitesse de lecture alignée avec la vitesse "Tortue" (Normal) du ReadingSpeedSelector
// Cette valeur doit être cohérente dans toute l'application
export const READING_SPEED_WPM = 120;

export const calculateReadingTime = (text: string | undefined): string => {
  if (!text) {
    return "0 min de lecture";
  }

  // Vitesse de lecture adaptée aux enfants, alignée avec estimateWordCountForDuration
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.round(wordCount / READING_SPEED_WPM);

  if (minutes < 1) {
    return "< 1 min de lecture";
  }

  return `${minutes} min de lecture`;
};
