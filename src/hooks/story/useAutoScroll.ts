
import { useCallback, useEffect } from "react";
import { useUserSettings } from "@/hooks/settings/useUserSettings";
import { useAutoScrollState } from "./useAutoScrollState";
import { useScrollDomUtils } from "./scrollDomUtils";
import { calculateScrollSpeed, calculateScrollMetrics, calculateTargetPosition } from "./scrollCalculations";

interface UseAutoScrollProps {
  wordCount: number;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  backgroundSoundControls?: {
    isPlaying: boolean;
    togglePlay: () => void;
    stopSound: () => void;
    musicEnabled: boolean;
  };
}

export const useAutoScroll = ({ wordCount, scrollAreaRef, backgroundSoundControls }: UseAutoScrollProps) => {
  const {
    scrollStatus,
    setScrollStatus,
    isManuallyPaused,
    setIsManuallyPaused,
    animationFrameRef,
    scrollStatusRef
  } = useAutoScrollState();

  const { getViewportElement, scrollToPosition } = useScrollDomUtils(scrollAreaRef);
  
  // Récupération des paramètres utilisateur
  const { userSettings } = useUserSettings();
  const readingSpeed = userSettings?.readingPreferences?.readingSpeed || 125;
  const autoScrollEnabled = userSettings?.readingPreferences?.autoScrollEnabled !== false;
  
  // Fonction pour synchroniser la musique avec le défilement
  const syncMusicWithScroll = useCallback((isScrolling: boolean) => {
    if (!backgroundSoundControls || !backgroundSoundControls.musicEnabled) {
      return;
    }
    
    console.log(`Auto-scroll: Synchronisation musique - Défilement: ${isScrolling ? 'ON' : 'OFF'}, Musique: ${backgroundSoundControls.isPlaying ? 'ON' : 'OFF'}`);
    
    if (isScrolling && !backgroundSoundControls.isPlaying) {
      // Le défilement démarre, démarrer la musique
      backgroundSoundControls.togglePlay();
      console.log("Auto-scroll: Musique démarrée avec le défilement");
    } else if (!isScrolling && backgroundSoundControls.isPlaying) {
      // Le défilement s'arrête, arrêter la musique
      backgroundSoundControls.togglePlay();
      console.log("Auto-scroll: Musique mise en pause avec le défilement");
    }
  }, [backgroundSoundControls]);
  
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
    
    // Synchroniser la musique au démarrage
    syncMusicWithScroll(true);
    
    const pixelsPerSecond = calculateScrollSpeed(readingSpeed);
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
      
      const targetPosition = calculateTargetPosition(startPosition, pixelsPerSecond, startTime);
      const { maxScrollPosition } = calculateScrollMetrics(viewportEl);
      
      if (targetPosition >= maxScrollPosition) {
        scrollToPosition(maxScrollPosition);
        console.log("Auto-scroll: Reached the end");
        setScrollStatus('idle');
        // Arrêter la musique quand on atteint la fin
        syncMusicWithScroll(false);
        return;
      }
      
      scrollToPosition(targetPosition);
      animationFrameRef.current = requestAnimationFrame(performScroll);
    };
    
    animationFrameRef.current = requestAnimationFrame(performScroll);
    
  }, [getViewportElement, readingSpeed, scrollStatusRef, setScrollStatus, setIsManuallyPaused, animationFrameRef, scrollToPosition, syncMusicWithScroll]);
  
  // Arrêter le défilement
  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setScrollStatus('idle');
    // Synchroniser la musique à l'arrêt
    syncMusicWithScroll(false);
    console.log("Auto-scroll: Stopped");
  }, [animationFrameRef, setScrollStatus, syncMusicWithScroll]);
  
  // Mettre en pause
  const pauseAutoScroll = useCallback(() => {
    if (scrollStatusRef.current === 'running') {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      setScrollStatus('paused');
      // Synchroniser la musique lors de la pause
      syncMusicWithScroll(false);
      console.log("Auto-scroll: Paused");
    }
  }, [scrollStatusRef, animationFrameRef, setScrollStatus, syncMusicWithScroll]);
  
  // Reprendre après pause
  const resumeAutoScroll = useCallback(() => {
    if (scrollStatusRef.current === 'paused') {
      setScrollStatus('running');
      // Synchroniser la musique lors de la reprise
      syncMusicWithScroll(true);
      console.log("Auto-scroll: Resumed");
      startAutoScroll();
    }
  }, [scrollStatusRef, setScrollStatus, startAutoScroll, syncMusicWithScroll]);
  
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
