
import { useState, useRef, useCallback, useEffect } from "react";
import { useUserSettings } from "@/hooks/settings/useUserSettings";

interface UseAutoScrollProps {
  wordCount: number;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

type ScrollStatus = 'idle' | 'running' | 'paused';

export const useAutoScroll = ({ wordCount, scrollAreaRef }: UseAutoScrollProps) => {
  const [scrollStatus, setScrollStatus] = useState<ScrollStatus>('idle');
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  
  // Références pour le défilement
  const animationFrameRef = useRef<number | null>(null);
  const scrollStatusRef = useRef<ScrollStatus>('idle');
  
  // Mettre à jour la référence quand l'état change
  useEffect(() => {
    scrollStatusRef.current = scrollStatus;
  }, [scrollStatus]);
  
  // Récupération des paramètres utilisateur
  const { userSettings } = useUserSettings();
  const readingSpeed = userSettings?.readingPreferences?.readingSpeed || 125;
  const autoScrollEnabled = userSettings?.readingPreferences?.autoScrollEnabled !== false;
  
  // Obtenir l'élément viewport
  const getViewportElement = useCallback(() => {
    if (!scrollAreaRef.current) return null;
    
    const viewportEl = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewportEl) {
      console.warn("Viewport element not found for auto-scroll");
      return null;
    }
    
    return viewportEl;
  }, [scrollAreaRef]);
  
  // Calculer la vitesse de défilement en pixels par seconde
  const calculateScrollSpeed = useCallback(() => {
    const wordsPerSecond = readingSpeed / 60;
    const pixelsPerSecond = wordsPerSecond * 2; // 2 pixels par mot
    return Math.max(10, Math.min(100, pixelsPerSecond));
  }, [readingSpeed]);
  
  // Démarrer le défilement
  const startAutoScroll = useCallback(() => {
    const viewportEl = getViewportElement();
    if (!viewportEl) return;
    
    if (scrollStatusRef.current === 'running') return;
    
    const contentHeight = viewportEl.scrollHeight;
    const viewportHeight = viewportEl.clientHeight;
    const maxScrollPosition = contentHeight - viewportHeight;
    
    if (viewportEl.scrollTop >= maxScrollPosition - 10) {
      console.log("Auto-scroll: Already at the bottom, not starting");
      return;
    }
    
    setScrollStatus('running');
    setIsManuallyPaused(false);
    
    const pixelsPerSecond = calculateScrollSpeed();
    const startTime = Date.now();
    const startPosition = viewportEl.scrollTop;
    
    console.log(`Auto-scroll: Starting with speed ${pixelsPerSecond.toFixed(2)} pixels/second`);
    
    const performScroll = () => {
      const viewportEl = getViewportElement();
      if (!viewportEl) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      // Utiliser la référence pour vérifier l'état actuel
      if (scrollStatusRef.current !== 'running') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000; // en secondes
      const targetPosition = startPosition + (pixelsPerSecond * elapsed);
      
      const contentHeight = viewportEl.scrollHeight;
      const viewportHeight = viewportEl.clientHeight;
      const maxScrollPosition = contentHeight - viewportHeight;
      
      if (targetPosition >= maxScrollPosition) {
        viewportEl.scrollTop = maxScrollPosition;
        console.log("Auto-scroll: Reached the end");
        setScrollStatus('idle');
        return;
      }
      
      viewportEl.scrollTop = targetPosition;
      animationFrameRef.current = requestAnimationFrame(performScroll);
    };
    
    animationFrameRef.current = requestAnimationFrame(performScroll);
    
  }, [getViewportElement, calculateScrollSpeed]);
  
  // Arrêter le défilement
  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setScrollStatus('idle');
    console.log("Auto-scroll: Stopped");
  }, []);
  
  // Mettre en pause
  const pauseAutoScroll = useCallback(() => {
    if (scrollStatusRef.current === 'running') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setScrollStatus('paused');
      console.log("Auto-scroll: Paused");
    }
  }, []);
  
  // Reprendre après pause
  const resumeAutoScroll = useCallback(() => {
    if (scrollStatusRef.current === 'paused') {
      setScrollStatus('running');
      console.log("Auto-scroll: Resumed");
      startAutoScroll();
    }
  }, [startAutoScroll]);
  
  // Fonction pour le bouton toggle
  const toggleAutoScroll = useCallback(() => {
    if (scrollStatusRef.current === 'idle') {
      startAutoScroll();
      console.log("Auto-scroll: Started manually");
    } else if (scrollStatusRef.current === 'running') {
      stopAutoScroll();
      setIsManuallyPaused(true);
      console.log("Auto-scroll: Stopped manually");
    } else if (scrollStatusRef.current === 'paused') {
      if (isManuallyPaused) {
        setIsManuallyPaused(false);
        startAutoScroll();
        console.log("Auto-scroll: Restarted after manual pause");
      } else {
        stopAutoScroll();
        console.log("Auto-scroll: Stopped from pause state");
      }
    }
  }, [isManuallyPaused, startAutoScroll, stopAutoScroll]);
  
  // Démarrer automatiquement si activé
  useEffect(() => {
    if (autoScrollEnabled && scrollStatus === 'idle' && !isManuallyPaused) {
      console.log("Auto-scroll: Auto-enabling from preferences");
      const timer = setTimeout(() => {
        startAutoScroll();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [autoScrollEnabled, scrollStatus, isManuallyPaused, startAutoScroll]);
  
  // Nettoyer les animations
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return {
    isAutoScrolling: scrollStatus === 'running',
    isPaused: scrollStatus === 'paused',
    isManuallyPaused,
    autoScrollEnabled,
    toggleAutoScroll,
    handlePauseScroll: pauseAutoScroll,
    handleResumeScroll: resumeAutoScroll,
    stopAutoScroll,
    scrollStatus
  };
};
