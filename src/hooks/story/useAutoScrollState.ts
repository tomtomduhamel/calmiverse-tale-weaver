
import { useState, useRef, useEffect } from "react";

export type ScrollStatus = 'idle' | 'running' | 'paused';

export const useAutoScrollState = () => {
  const [scrollStatus, setScrollStatus] = useState<ScrollStatus>('idle');
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  
  // Références pour le défilement
  const animationFrameRef = useRef<number | null>(null);
  const scrollStatusRef = useRef<ScrollStatus>('idle');
  
  // Mettre à jour la référence quand l'état change
  useEffect(() => {
    scrollStatusRef.current = scrollStatus;
  }, [scrollStatus]);

  // Nettoyer les animations au démontage
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return {
    scrollStatus,
    setScrollStatus,
    isManuallyPaused,
    setIsManuallyPaused,
    animationFrameRef,
    scrollStatusRef
  };
};
