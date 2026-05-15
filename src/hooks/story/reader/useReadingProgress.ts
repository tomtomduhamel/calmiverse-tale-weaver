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
  const pauseStartRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);

  // Remise à zéro complète quand on sort de toute lecture (idle)
  useEffect(() => {
    if (!isAutoScrolling && !isPaused && !isManuallyPaused) {
      setCurrentWordIndex(-1);
      startTimeRef.current = null;
      pausedTimeRef.current = 0;
      pauseStartRef.current = null;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    }
  }, [isAutoScrolling, isPaused, isManuallyPaused]);

  useEffect(() => {
    if (!isAutoScrolling) return;

    // === Entrée en pause ===
    if (isPaused || isManuallyPaused) {
      if (pauseStartRef.current === null) {
        pauseStartRef.current = performance.now();
      }
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    // === Reprise après pause : compenser la durée écoulée ===
    if (pauseStartRef.current !== null) {
      pausedTimeRef.current += performance.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }

    const wordsPerSecond = readingSpeed / 60;
    const msPerWord = 1000 / wordsPerSecond;

    const animate = (time: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = time;
      }

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
        frameRef.current = null;
      }
    };
  }, [isAutoScrolling, isPaused, isManuallyPaused, readingSpeed, totalWords]);

  return { currentWordIndex };
};
