
export const calculateReadingTime = (text: string | undefined): string => {
  if (!text) {
    return "0 min de lecture";
  }

  // Utilisation d'une vitesse de lecture plus lente, adaptée aux enfants
  const wordsPerMinute = 125; // Réduction de 250 à 125 mots par minute
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute); // Utiliser Math.ceil au lieu de Math.round pour arrondir à la minute supérieure

  if (minutes < 1) {
    return "< 1 min de lecture";
  }

  return `${minutes} min de lecture`;
};
