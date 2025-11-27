
import { useCallback, useEffect } from "react";
import { useUserSettings } from "@/hooks/settings/useUserSettings";
import { useReadingSpeed } from "@/contexts/ReadingSpeedContext";
import { useAutoScrollState } from "./useAutoScrollState";
import { useScrollDomUtils } from "./scrollDomUtils";
import { calculateScrollSpeed, calculateScrollMetrics, calculateTargetPosition } from "./scrollCalculations";

interface UseAutoScrollProps {
  wordCount: number;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  onScrollStateChange?: (isScrolling: boolean) => void;
}

export const useAutoScroll = ({ wordCount, scrollAreaRef, onScrollStateChange }: UseAutoScrollProps) => {
  const {
    scrollStatus,
    setScrollStatus,
    isManuallyPaused,
    setIsManuallyPaused,
    animationFrameRef,
    scrollStatusRef
  } = useAutoScrollState();

  const { getViewportElement, scrollToPosition } = useScrollDomUtils(scrollAreaRef);
  
  // Récupération de la vitesse de lecture depuis le Context partagé
  const { readingSpeed } = useReadingSpeed();
  
  // Récupération des autres paramètres utilisateur
  const { userSettings } = useUserSettings();
  const autoScrollEnabled = userSettings?.readingPreferences?.autoScrollEnabled !== false;
  
  // Notifier les changements d'état de défilement
  const notifyScrollStateChange = useCallback((isScrolling: boolean) => {
    if (onScrollStateChange) {
      onScrollStateChange(isScrolling);
    }
  }, [onScrollStateChange]);
  
  // Démarrer le défilement
  const startAutoScroll = useCallback(() => {
    const viewportEl = getViewportElement();
    if (!viewportEl) return;
    
    if (scrollStatusRef.current === 'running') return;
    
    const { maxScrollPosition, isAtBottom } = calculateScrollMetrics(viewportEl);
    
    if (isAtBottom) {
      console.log("Auto-scroll: Already at the bottom, not starting");
      return;
    }
    
    setScrollStatus('running');
    setIsManuallyPaused(false);
    
    // Notifier que le défilement commence
    notifyScrollStateChange(true);
    
    const pixelsPerSecond = calculateScrollSpeed(readingSpeed);
    const startTime = Date.now();
    const startPosition = viewportEl.scrollTop;
    
    console.log(`[AutoScroll] Paramètre utilisateur: ${readingSpeed} mots/min`);
    console.log(`[AutoScroll] Vitesse de défilement calculée: ${pixelsPerSecond.toFixed(2)} pixels/seconde`);
    
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
      
      const targetPosition = calculateTargetPosition(startPosition, pixelsPerSecond, startTime);
      const { maxScrollPosition } = calculateScrollMetrics(viewportEl);
      
      if (targetPosition >= maxScrollPosition) {
        scrollToPosition(maxScrollPosition);
        console.log("Auto-scroll: Reached the end");
        setScrollStatus('idle');
        // Notifier que le défilement s'arrête
        notifyScrollStateChange(false);
        return;
      }
      
      scrollToPosition(targetPosition);
      animationFrameRef.current = requestAnimationFrame(performScroll);
    };
    
    animationFrameRef.current = requestAnimationFrame(performScroll);
    
  }, [getViewportElement, readingSpeed, scrollStatusRef, setScrollStatus, setIsManuallyPaused, animationFrameRef, scrollToPosition, notifyScrollStateChange]);
  
  // Arrêter le défilement
  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setScrollStatus('idle');
    // Notifier que le défilement s'arrête
    notifyScrollStateChange(false);
    console.log("Auto-scroll: Stopped");
  }, [animationFrameRef, setScrollStatus, notifyScrollStateChange]);
  
  // Mettre en pause
  const pauseAutoScroll = useCallback(() => {
    if (scrollStatusRef.current === 'running') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setScrollStatus('paused');
      // Notifier que le défilement se met en pause
      notifyScrollStateChange(false);
      console.log("Auto-scroll: Paused");
    }
  }, [scrollStatusRef, animationFrameRef, setScrollStatus, notifyScrollStateChange]);
  
  // Reprendre après pause
  const resumeAutoScroll = useCallback(() => {
    if (scrollStatusRef.current === 'paused') {
      setScrollStatus('running');
      // Notifier que le défilement reprend
      notifyScrollStateChange(true);
      console.log("Auto-scroll: Resumed");
      startAutoScroll();
    }
  }, [scrollStatusRef, setScrollStatus, startAutoScroll, notifyScrollStateChange]);
  
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
  }, [isManuallyPaused, startAutoScroll, stopAutoScroll, scrollStatusRef, setIsManuallyPaused]);
  
  // Redémarrer le scroll quand la vitesse change (si déjà en cours)
  useEffect(() => {
    if (scrollStatusRef.current === 'running') {
      console.log(`[AutoScroll] Vitesse changée en ${readingSpeed} mots/min - redémarrage du scroll`);
      
      // Arrêter complètement le scroll actuel
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Réinitialiser le status de manière synchrone via la ref
      scrollStatusRef.current = 'idle';
      
      // Redémarrer immédiatement avec la nouvelle vitesse
      // startAutoScroll va maintenant fonctionner car scrollStatusRef.current n'est plus 'running'
      startAutoScroll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readingSpeed]);
  
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
