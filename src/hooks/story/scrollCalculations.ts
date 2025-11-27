
export const calculateScrollSpeed = (readingSpeed: number): number => {
  // Plage de vitesse de défilement adaptée à la lecture à voix haute (en pixels/seconde)
  const minSpeed = 3;    // Pour 50 mots/min - défilement très lent, lecture expressive
  const maxSpeed = 30;   // Pour 300 mots/min - défilement maximum (lecture rapide à voix haute)
  
  // Paramètres de vitesse de lecture utilisateur (en mots/minute)
  const minReadingSpeed = 50;
  const maxReadingSpeed = 300;
  
  // Normaliser la vitesse de lecture vers [0, 1]
  const normalizedSpeed = Math.max(0, Math.min(1, 
    (readingSpeed - minReadingSpeed) / (maxReadingSpeed - minReadingSpeed)
  ));
  
  // Interpolation linéaire entre minSpeed et maxSpeed
  const pixelsPerSecond = minSpeed + (normalizedSpeed * (maxSpeed - minSpeed));
  
  console.log(`[AutoScroll] Vitesse lecture: ${readingSpeed} mots/min → ${pixelsPerSecond.toFixed(1)} px/sec`);
  
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
