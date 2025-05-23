
export const calculateScrollSpeed = (readingSpeed: number): number => {
  const wordsPerSecond = readingSpeed / 60;
  const pixelsPerSecond = wordsPerSecond * 2; // 2 pixels par mot
  return Math.max(10, Math.min(100, pixelsPerSecond));
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
