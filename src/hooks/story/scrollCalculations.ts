
export const calculateScrollSpeed = (
  readingSpeed: number, 
  wordCount: number, 
  viewportEl: HTMLElement
): number => {
  if (wordCount <= 0) return 10;
  
  const contentHeight = viewportEl.scrollHeight;
  const viewportHeight = viewportEl.clientHeight;
  const scrollDistance = Math.max(0, contentHeight - viewportHeight);
  
  // Temps total nécessaire pour lire toute l'histoire en secondes
  const totalSeconds = (wordCount / readingSpeed) * 60;
  
  if (totalSeconds <= 0) return 10;
  
  // Vitesse de défilement mathématique stricte pour parfaitement synchroniser 
  // le défilement et le mot surligné du début à la fin de l'histoire
  const pixelsPerSecond = scrollDistance / totalSeconds;
  
  console.log(`[AutoScroll] Synchronisation parfaite: Distance=${scrollDistance}px, Temps=${totalSeconds.toFixed(1)}s → ${pixelsPerSecond.toFixed(1)} px/sec`);
  
  return pixelsPerSecond;
};

export const calculateScrollMetrics = (viewportEl: HTMLElement) => {
  const contentHeight = viewportEl.scrollHeight;
  const viewportHeight = viewportEl.clientHeight;
  const maxScrollPosition = contentHeight - viewportHeight;
  const currentPosition = viewportEl.scrollTop;
  
  return {
    contentHeight,
    viewportHeight,
    maxScrollPosition,
    currentPosition,
    isAtBottom: currentPosition >= maxScrollPosition - 10
  };
};

export const calculateTargetPosition = (
  startPosition: number,
  pixelsPerSecond: number,
  startTime: number
): number => {
  const currentTime = Date.now();
  const elapsed = (currentTime - startTime) / 1000; // en secondes
  return startPosition + (pixelsPerSecond * elapsed);
};
