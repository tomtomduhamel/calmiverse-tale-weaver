export const calculateReadingTime = (text: string | undefined): string => {
  if (!text) {
    return "0 min de lecture";
  }

  const wordsPerMinute = 250;
  const wordCount = text.trim().split(/\s+/).length;
  const minutes = Math.round(wordCount / wordsPerMinute);

  if (minutes < 1) {
    return "< 1 min de lecture";
  }

  return `${minutes} min de lecture`;
};