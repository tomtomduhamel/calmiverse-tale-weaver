
import { useState, useRef, useCallback, useEffect } from "react";
import { useUserSettings } from "@/hooks/settings/useUserSettings";

interface UseAutoScrollProps {
  wordCount: number;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
}

export const useAutoScroll = ({ wordCount, scrollAreaRef }: UseAutoScrollProps) => {
  const [isAutoScrolling, setIsAutoScrolling] = useState(false);
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  
  const { userSettings } = useUserSettings();
  const readingSpeed = userSettings?.readingPreferences?.readingSpeed || 125;
  const autoScrollEnabled = userSettings?.readingPreferences?.autoScrollEnabled || false;
  
  const scrollIntervalRef = useRef<number | null>(null);
  const scrollStartTimeRef = useRef<number | null>(null);
  const pauseStartTimeRef = useRef<number | null>(null);
  const totalPausedTimeRef = useRef<number>(0);
  const isScrollPausedRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);
  
  // Fonction pour démarrer le défilement automatique
  const startAutoScroll = useCallback(() => {
    if (!scrollAreaRef.current || scrollIntervalRef.current) return;
    
    // Obtenir l'élément viewport de ScrollArea à partir de la référence
    const viewportEl = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    if (!viewportEl) return;

    const contentHeight = viewportEl.scrollHeight;
    const viewportHeight = viewportEl.clientHeight;
    const scrollDistance = contentHeight - viewportHeight;
    
    // Si déjà en bas, ne pas démarrer
    if (viewportEl.scrollTop >= scrollDistance) return;

    const totalMinutesToRead = wordCount / readingSpeed;
    const totalMsToRead = totalMinutesToRead * 60 * 1000; // Convertir en millisecondes
    
    // Réinitialiser les valeurs de temps
    scrollStartTimeRef.current = Date.now();
    totalPausedTimeRef.current = 0;
    pauseStartTimeRef.current = null;
    
    // Enregistrer la position de défilement actuelle
    const startScrollTop = viewportEl.scrollTop;
    
    // Mettre à jour l'état pour afficher l'indicateur
    setIsAutoScrolling(true);
    isScrollPausedRef.current = false;
    
    // Si on démarre le défilement, désactiver l'état de pause manuelle
    setIsManuallyPaused(false);

    // Appliquer une transition pour le défilement fluide
    viewportEl.style.scrollBehavior = 'smooth';
    
    // Fonction de défilement utilisant requestAnimationFrame
    const scrollStep = () => {
      if (!viewportEl || isScrollPausedRef.current) {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = requestAnimationFrame(scrollStep);
        }
        return;
      }
      
      // Calculer le temps écoulé en tenant compte des pauses
      const currentTime = Date.now();
      const startTime = scrollStartTimeRef.current || 0;
      const pausedTime = totalPausedTimeRef.current;
      const effectiveElapsedTime = currentTime - startTime - pausedTime;
      
      // Calculer la progression du défilement
      const scrollProgress = Math.min(effectiveElapsedTime / totalMsToRead, 1);
      const newScrollTop = startScrollTop + (scrollDistance - startScrollTop) * scrollProgress;
      
      // Défilement progressif avec easing
      const currentScrollTop = viewportEl.scrollTop;
      const easedScrollTop = currentScrollTop + (newScrollTop - currentScrollTop) * 0.05;
      viewportEl.scrollTop = easedScrollTop;
      
      // Si on atteint la fin, arrêter le défilement automatique
      if (scrollProgress >= 1 || Math.abs(newScrollTop - scrollDistance) < 1) {
        stopAutoScroll();
        return;
      }
      
      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };
    
    // Démarrer l'animation
    animationFrameRef.current = requestAnimationFrame(scrollStep);
  }, [wordCount, readingSpeed, scrollAreaRef]);
  
  // Fonction pour arrêter complètement le défilement automatique
  const stopAutoScroll = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    
    scrollStartTimeRef.current = null;
    pauseStartTimeRef.current = null;
    totalPausedTimeRef.current = 0;
    isScrollPausedRef.current = false;
    setIsAutoScrolling(false);
    
    // Restaurer le comportement de défilement par défaut
    if (scrollAreaRef.current) {
      const viewportEl = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
      if (viewportEl) {
        viewportEl.style.scrollBehavior = '';
      }
    }
  }, [scrollAreaRef]);
  
  // Fonction pour gérer la pause temporaire (bouton flottant)
  const handlePauseScroll = useCallback(() => {
    if (isAutoScrolling && !isScrollPausedRef.current) {
      isScrollPausedRef.current = true;
      pauseStartTimeRef.current = Date.now();
      console.log("Défilement mis en pause temporairement");
    }
  }, [isAutoScrolling]);
  
  // Fonction pour reprendre le défilement (bouton flottant)
  const handleResumeScroll = useCallback(() => {
    if (isAutoScrolling && isScrollPausedRef.current && !isManuallyPaused) {
      // Calculer la durée de la pause
      if (pauseStartTimeRef.current) {
        const pauseDuration = Date.now() - pauseStartTimeRef.current;
        totalPausedTimeRef.current += pauseDuration;
        console.log(`Défilement repris après une pause de ${pauseDuration}ms`);
      }
      
      isScrollPausedRef.current = false;
      pauseStartTimeRef.current = null;
    }
  }, [isAutoScrolling, isManuallyPaused]);
  
  // Fonction pour le bouton toggle (bouton supérieur)
  const toggleAutoScroll = useCallback(() => {
    if (isAutoScrolling) {
      // Si le défilement est actif, l'arrêter complètement et marquer comme pause manuelle
      stopAutoScroll();
      setIsManuallyPaused(true);
      console.log("Défilement arrêté manuellement");
    } else {
      // Si le défilement est arrêté, le démarrer et réinitialiser l'état de pause manuelle
      startAutoScroll();
      setIsManuallyPaused(false);
      console.log("Défilement démarré manuellement");
    }
  }, [isAutoScrolling, startAutoScroll, stopAutoScroll]);
  
  // Démarrer le défilement automatique si l'option est activée et qu'il n'a pas été arrêté manuellement
  useEffect(() => {
    if (autoScrollEnabled && !isAutoScrolling && !isManuallyPaused) {
      console.log("Tentative de démarrage auto-scroll, isManuallyPaused:", isManuallyPaused);
      // Attendre un peu pour permettre au contenu de se charger complètement
      const timer = setTimeout(() => {
        startAutoScroll();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [autoScrollEnabled, isAutoScrolling, isManuallyPaused, startAutoScroll]);
  
  // Nettoyer l'intervalle et l'animation lors du démontage du composant
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  return {
    isAutoScrolling,
    isManuallyPaused,
    autoScrollEnabled,
    toggleAutoScroll,
    handlePauseScroll,
    handleResumeScroll,
    stopAutoScroll
  };
};
