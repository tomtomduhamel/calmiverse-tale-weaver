
export const calculateScrollSpeed = (readingSpeed: number): number => {
  // Plage de vitesse de défilement adaptée à la lecture à voix haute (en pixels/seconde)
  const minSpeed = 5;    // Pour 90 mots/min - défilement lent, lecture expressive
  const maxSpeed = 20;   // Pour 150 mots/min - défilement rapide mais lisible
  
  // Paramètres de vitesse de lecture utilisateur (en mots/minute)
  // Alignés avec les presets: Escargot 90, Tortue 120, Lapin 150
  const minReadingSpeed = 90;
  const maxReadingSpeed = 150;
  
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
