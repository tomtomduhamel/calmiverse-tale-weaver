
import { useState, useRef, useCallback, useEffect } from "react";
import { useUserSettings } from "@/hooks/settings/useUserSettings";

interface UseAutoScrollProps {
  wordCount: number;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

// Type des états possibles du défilement
type ScrollStatus = 'idle' | 'running' | 'paused';

export const useAutoScroll = ({ wordCount, scrollAreaRef }: UseAutoScrollProps) => {
  // État simplifié avec une enum claire
  const [scrollStatus, setScrollStatus] = useState<ScrollStatus>('idle');
  
  // Gestion de l'état manuel (utilisé pour les reprises automatiques)
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  
  // Références pour gérer le défilement
  const animationFrameRef = useRef<number | null>(null);
  const scrollStartTimeRef = useRef<number | null>(null);
  const scrollStartPositionRef = useRef<number>(0);
  const lastScrollTimeRef = useRef<number | null>(null);
  
  // Récupération des paramètres utilisateur
  const { userSettings } = useUserSettings();
  const readingSpeed = userSettings?.readingPreferences?.readingSpeed || 125; // mots par minute
  const autoScrollEnabled = userSettings?.readingPreferences?.backgroundMusicEnabled !== false && 
                            userSettings?.readingPreferences?.autoScrollEnabled !== false;
  
  // Constantes de configuration du défilement
  const SCROLL_SPEED_FACTOR = 0.08; // pixels par mot
  
  // Fonction pour obtenir l'élément viewport
  const getViewportElement = useCallback(() => {
    if (!scrollAreaRef.current) return null;
    
    const viewportEl = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewportEl) {
      console.warn("Viewport element not found for auto-scroll");
      return null;
    }
    
    return viewportEl;
  }, [scrollAreaRef]);
  
  // Calcule la vitesse de défilement en pixels/seconde
  const calculateScrollSpeed = useCallback(() => {
    // Convertir la vitesse de mots/minute en pixels/seconde
    const wordsPerSecond = readingSpeed / 60;
    const pixelsPerSecond = wordsPerSecond * SCROLL_SPEED_FACTOR * 100; // Ajustement pour une vitesse plus naturelle
    
    return Math.max(10, Math.min(200, pixelsPerSecond)); // Limites de vitesse pour éviter les extrêmes
  }, [readingSpeed]);
  
  // Démarrer le défilement automatique
  const startAutoScroll = useCallback(() => {
    const viewportEl = getViewportElement();
    if (!viewportEl || scrollStatus === 'running') return;
    
    // Récupérer les dimensions actuelles
    const contentHeight = viewportEl.scrollHeight;
    const viewportHeight = viewportEl.clientHeight;
    const maxScrollPosition = contentHeight - viewportHeight;
    
    // Si on est déjà en bas, ne pas démarrer
    if (viewportEl.scrollTop >= maxScrollPosition - 10) {
      console.log("Auto-scroll: Already at the bottom, not starting");
      return;
    }
    
    // Initialiser les références
    scrollStartTimeRef.current = Date.now();
    lastScrollTimeRef.current = Date.now();
    scrollStartPositionRef.current = viewportEl.scrollTop;
    
    // Activer le comportement de défilement fluide
    viewportEl.style.scrollBehavior = 'smooth';
    
    // Mettre à jour l'état de défilement
    setScrollStatus('running');
    setIsManuallyPaused(false);
    
    // Calculer la vitesse de défilement
    const pixelsPerSecond = calculateScrollSpeed();
    console.log(`Auto-scroll: Starting with speed ${pixelsPerSecond.toFixed(2)} pixels/second`);
    
    // Fonction de défilement basée sur le temps
    const performScroll = (timestamp: number) => {
      const viewportEl = getViewportElement();
      if (!viewportEl || scrollStatus !== 'running') {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
        return;
      }
      
      // Calculer le temps écoulé depuis la dernière mise à jour
      const currentTime = Date.now();
      const lastScrollTime = lastScrollTimeRef.current || currentTime;
      const timeElapsedSinceLastScroll = currentTime - lastScrollTime;
      
      // Mettre à jour la position de défilement
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
  
  // Arrêter complètement le défilement
  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Réinitialiser les références
    scrollStartTimeRef.current = null;
    lastScrollTimeRef.current = null;
    
    // Restaurer le comportement de défilement normal
    const viewportEl = getViewportElement();
    if (viewportEl) {
      viewportEl.style.scrollBehavior = '';
    }
    
    // Mettre à jour l'état
    setScrollStatus('idle');
  }, [getViewportElement]);
  
  // Mettre en pause le défilement
  const pauseAutoScroll = useCallback(() => {
    if (scrollStatus === 'running') {
      // Annuler l'animation en cours
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Mettre à jour l'état
      setScrollStatus('paused');
      console.log("Auto-scroll: Paused");
    }
  }, [scrollStatus]);
  
  // Reprendre le défilement après une pause
  const resumeAutoScroll = useCallback(() => {
    if (scrollStatus === 'paused') {
      const viewportEl = getViewportElement();
      if (!viewportEl) return;
      
      // Mettre à jour les références pour la reprise
      scrollStartTimeRef.current = Date.now();
      lastScrollTimeRef.current = Date.now();
      scrollStartPositionRef.current = viewportEl.scrollTop;
      
      // Relancer le défilement
      setScrollStatus('running');
      console.log("Auto-scroll: Resumed");
      
      // Redémarrer avec les nouveaux paramètres
      startAutoScroll();
    }
  }, [scrollStatus, getViewportElement, startAutoScroll]);
  
  // Fonction pour gérer la pause temporaire (bouton flottant)
  const handlePauseScroll = useCallback(() => {
    if (scrollStatus === 'running') {
      pauseAutoScroll();
    }
  }, [scrollStatus, pauseAutoScroll]);
  
  // Fonction pour reprendre le défilement (bouton flottant)
  const handleResumeScroll = useCallback(() => {
    if (scrollStatus === 'paused' && !isManuallyPaused) {
      resumeAutoScroll();
    }
  }, [scrollStatus, isManuallyPaused, resumeAutoScroll]);
  
  // Fonction pour le bouton toggle (bouton supérieur)
  const toggleAutoScroll = useCallback(() => {
    if (scrollStatus === 'idle') {
      // Démarrer le défilement
      startAutoScroll();
      setIsManuallyPaused(false);
      console.log("Auto-scroll: Started manually");
    } else if (scrollStatus === 'running') {
      // Arrêter le défilement et marquer comme pause manuelle
      stopAutoScroll();
      setIsManuallyPaused(true);
      console.log("Auto-scroll: Stopped manually");
    } else if (scrollStatus === 'paused') {
      // Si en pause, reprendre ou arrêter selon l'état de pause manuelle
      if (isManuallyPaused) {
        // Si c'était une pause manuelle, on redémarre
        setIsManuallyPaused(false);
        startAutoScroll();
        console.log("Auto-scroll: Restarted after manual pause");
      } else {
        // Sinon on arrête complètement
        stopAutoScroll();
        setIsManuallyPaused(false);
        console.log("Auto-scroll: Stopped from pause state");
      }
    }
  }, [scrollStatus, isManuallyPaused, startAutoScroll, stopAutoScroll]);
  
  // Démarrer automatiquement le défilement si activé dans les préférences
  // et que le défilement n'a pas été arrêté manuellement
  useEffect(() => {
    if (autoScrollEnabled && scrollStatus === 'idle' && !isManuallyPaused) {
      console.log("Auto-scroll: Auto-enabling from preferences");
      // Attendre un peu pour permettre au contenu de se charger complètement
      const timer = setTimeout(() => {
        startAutoScroll();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [autoScrollEnabled, scrollStatus, isManuallyPaused, startAutoScroll]);
  
  // Nettoyer les animations lors du démontage
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
