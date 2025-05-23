
import { useState, useRef, useCallback, useEffect } from "react";
import { useUserSettings } from "@/hooks/settings/useUserSettings";

interface UseAutoScrollProps {
  wordCount: number;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

// Type des états possibles du défilement
type ScrollStatus = 'idle' | 'running' | 'paused';

export const useAutoScroll = ({ wordCount, scrollAreaRef }: UseAutoScrollProps) => {
  // État du défilement
  const [scrollStatus, setScrollStatus] = useState<ScrollStatus>('idle');
  
  // État de pause manuelle 
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  
  // Références pour le défilement
  const animationFrameRef = useRef<number | null>(null);
  const scrollStartTimeRef = useRef<number | null>(null);
  const scrollStartPositionRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number | null>(null);
  
  // Récupération des paramètres utilisateur
  const { userSettings } = useUserSettings();
  const readingSpeed = userSettings?.readingPreferences?.readingSpeed || 125; // mots par minute
  const autoScrollEnabled = userSettings?.readingPreferences?.backgroundMusicEnabled !== false && 
                            userSettings?.readingPreferences?.autoScrollEnabled !== false;
  
  // Constante de vitesse
  const SCROLL_SPEED_FACTOR = 0.08;
  
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
  
  // Calculer la vitesse de défilement
  const calculateScrollSpeed = useCallback(() => {
    const wordsPerSecond = readingSpeed / 60;
    const pixelsPerSecond = wordsPerSecond * SCROLL_SPEED_FACTOR * 100;
    
    return Math.max(10, Math.min(200, pixelsPerSecond));
  }, [readingSpeed]);
  
  // Démarrer le défilement
  const startAutoScroll = useCallback(() => {
    const viewportEl = getViewportElement();
    if (!viewportEl) return;
    
    // Si déjà en cours de défilement, ne rien faire
    if (scrollStatus === 'running') return;
    
    // Récupérer les dimensions
    const contentHeight = viewportEl.scrollHeight;
    const viewportHeight = viewportEl.clientHeight;
    const maxScrollPosition = contentHeight - viewportHeight;
    
    // Si déjà en bas, ne pas démarrer
    if (viewportEl.scrollTop >= maxScrollPosition - 10) {
      console.log("Auto-scroll: Already at the bottom, not starting");
      return;
    }
    
    // Initialiser les références
    scrollStartTimeRef.current = Date.now();
    lastScrollTimeRef.current = Date.now();
    scrollStartPositionRef.current = viewportEl.scrollTop;
    
    // Activer le défilement fluide
    viewportEl.style.scrollBehavior = 'smooth';
    
    // Mettre à jour l'état
    setScrollStatus('running');
    setIsManuallyPaused(false);
    
    // Calculer la vitesse
    const pixelsPerSecond = calculateScrollSpeed();
    console.log(`Auto-scroll: Starting with speed ${pixelsPerSecond.toFixed(2)} pixels/second`);
    
    // Fonction de défilement
    const performScroll = (timestamp: number) => {
      const viewportEl = getViewportElement();
      if (!viewportEl) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      // Vérifier si on est toujours en mode défilement
      if (scrollStatus !== 'running') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      // Calculer le temps écoulé
      const currentTime = Date.now();
      const lastScrollTime = lastScrollTimeRef.current || currentTime;
      const timeElapsedSinceLastScroll = currentTime - lastScrollTime;
      
      // Mettre à jour la position
      const pixelsToScroll = (pixelsPerSecond * timeElapsedSinceLastScroll) / 1000;
      const newScrollTop = Math.min(
        viewportEl.scrollTop + pixelsToScroll,
        contentHeight - viewportHeight
      );
      
      // Effectuer le défilement
      viewportEl.scrollTop = newScrollTop;
      lastScrollTimeRef.current = currentTime;
      
      // Vérifier si on a atteint la fin
      if (Math.abs(newScrollTop - (contentHeight - viewportHeight)) < 2) {
        console.log("Auto-scroll: Reached the end");
        stopAutoScroll();
        return;
      }
      
      // Continuer le défilement
      animationFrameRef.current = requestAnimationFrame(performScroll);
    };
    
    // Démarrer l'animation
    animationFrameRef.current = requestAnimationFrame(performScroll);
    
  }, [getViewportElement, calculateScrollSpeed, scrollStatus]);
  
  // Arrêter le défilement
  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Réinitialiser les références
    scrollStartTimeRef.current = null;
    lastScrollTimeRef.current = null;
    
    // Restaurer le comportement normal
    const viewportEl = getViewportElement();
    if (viewportEl) {
      viewportEl.style.scrollBehavior = '';
    }
    
    // Mettre à jour l'état
    setScrollStatus('idle');
  }, [getViewportElement]);
  
  // Mettre en pause
  const pauseAutoScroll = useCallback(() => {
    if (scrollStatus === 'running') {
      // Annuler l'animation
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Mettre à jour l'état
      setScrollStatus('paused');
      console.log("Auto-scroll: Paused");
    }
  }, [scrollStatus]);
  
  // Reprendre après pause
  const resumeAutoScroll = useCallback(() => {
    if (scrollStatus === 'paused') {
      const viewportEl = getViewportElement();
      if (!viewportEl) return;
      
      // Mettre à jour les références
      scrollStartTimeRef.current = Date.now();
      lastScrollTimeRef.current = Date.now();
      scrollStartPositionRef.current = viewportEl.scrollTop;
      
      // Relancer le défilement
      setScrollStatus('running');
      console.log("Auto-scroll: Resumed");
      
      // Redémarrer
      startAutoScroll();
    }
  }, [scrollStatus, getViewportElement, startAutoScroll]);
  
  // Gérer la pause temporaire
  const handlePauseScroll = useCallback(() => {
    if (scrollStatus === 'running') {
      pauseAutoScroll();
    }
  }, [scrollStatus, pauseAutoScroll]);
  
  // Reprendre le défilement
  const handleResumeScroll = useCallback(() => {
    if (scrollStatus === 'paused' && !isManuallyPaused) {
      resumeAutoScroll();
    }
  }, [scrollStatus, isManuallyPaused, resumeAutoScroll]);
  
  // Fonction pour le bouton toggle
  const toggleAutoScroll = useCallback(() => {
    if (scrollStatus === 'idle') {
      // Démarrer
      startAutoScroll();
      setIsManuallyPaused(false);
      console.log("Auto-scroll: Started manually");
    } else if (scrollStatus === 'running') {
      // Arrêter et marquer comme pause manuelle
      stopAutoScroll();
      setIsManuallyPaused(true);
      console.log("Auto-scroll: Stopped manually");
    } else if (scrollStatus === 'paused') {
      // Gérer la reprise selon l'état de pause
      if (isManuallyPaused) {
        // Redémarrer après pause manuelle
        setIsManuallyPaused(false);
        startAutoScroll();
        console.log("Auto-scroll: Restarted after manual pause");
      } else {
        // Arrêter complètement
        stopAutoScroll();
        setIsManuallyPaused(false);
        console.log("Auto-scroll: Stopped from pause state");
      }
    }
  }, [scrollStatus, isManuallyPaused, startAutoScroll, stopAutoScroll]);
  
  // Démarrer automatiquement si activé
  useEffect(() => {
    if (autoScrollEnabled && scrollStatus === 'idle' && !isManuallyPaused) {
      console.log("Auto-scroll: Auto-enabling from preferences");
      // Attendre un peu pour charger le contenu
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
  
  // Retourner l'API du hook
  return {
    isAutoScrolling: scrollStatus === 'running',
    isPaused: scrollStatus === 'paused',
    isManuallyPaused,
    autoScrollEnabled,
    toggleAutoScroll,
    handlePauseScroll,
    handleResumeScroll,
    stopAutoScroll,
    scrollStatus
  };
};
