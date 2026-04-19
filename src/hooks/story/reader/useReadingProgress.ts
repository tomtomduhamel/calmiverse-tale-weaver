import { useState, useEffect, useRef } from 'react';

interface UseReadingProgressProps {
  isAutoScrolling: boolean;
  isPaused: boolean;
  isManuallyPaused: boolean;
  readingSpeed: number; // Mots par minute
  totalWords: number;
}

export const useReadingProgress = ({
  isAutoScrolling,
  isPaused,
  isManuallyPaused,
  readingSpeed,
  totalWords,
}: UseReadingProgressProps) => {
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const startTimeRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);
  const frameRef = useRef<number | null>(null);

  // Remise à zéro quand on arrête le défilement (pas juste pause, mais STOP)
  useEffect(() => {
    if (!isAutoScrolling) {
      setCurrentWordIndex(-1);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    }
  }, [isAutoScrolling]);

  useEffect(() => {
    // Ne rien faire si on n'est pas en auto-scroll
    if (!isAutoScrolling) return;

    // Si on est en pause, on enregistre le temps pour le déduire plus tard
    if (isPaused || isManuallyPaused) {
      if (lastUpdateRef.current > 0) {
        pausedTimeRef.current += performance.now() - lastUpdateRef.current;
        lastUpdateRef.current = performance.now();
      }
      return;
    }

    const wordsPerSecond = readingSpeed / 60;
    const msPerWord = 1000 / wordsPerSecond;

    const animate = (time: number) => {
      if (!startTimeRef.current) {
        startTimeRef.current = time;
      }
      
      lastUpdateRef.current = time;

      const elapsed = time - startTimeRef.current - pausedTimeRef.current;
      const calculatedIndex = Math.floor(elapsed / msPerWord);

      if (calculatedIndex >= 0 && calculatedIndex < totalWords) {
        setCurrentWordIndex(calculatedIndex);
      }

      if (calculatedIndex < totalWords) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [isAutoScrolling, isPaused, isManuallyPaused, readingSpeed, totalWords]);

  return { currentWordIndex };
};
