
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
  const isScrollPausedRef = useRef<boolean>(false);
  
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
    
    // Enregistrer le temps de départ et la position de défilement actuelle
    scrollStartTimeRef.current = Date.now();
    const startScrollTop = viewportEl.scrollTop;
    
    // Mettre à jour l'état pour afficher l'indicateur
    setIsAutoScrolling(true);
    isScrollPausedRef.current = false;
    
    // Si on démarre le défilement, désactiver l'état de pause manuelle
    setIsManuallyPaused(false);
    
    // Démarrer le défilement à intervalles réguliers
    scrollIntervalRef.current = window.setInterval(() => {
      if (!viewportEl || isScrollPausedRef.current) return;
      
      const elapsedMs = Date.now() - (scrollStartTimeRef.current || 0);
      const scrollProgress = Math.min(elapsedMs / totalMsToRead, 1);
      const newScrollTop = startScrollTop + (scrollDistance - startScrollTop) * scrollProgress;
      
      // Si on atteint la fin, arrêter le défilement automatique
      if (scrollProgress >= 1) {
        stopAutoScroll();
        return;
      }
      
      viewportEl.scrollTop = newScrollTop;
    }, 16); // ~60fps
  }, [wordCount, readingSpeed, scrollAreaRef]);
  
  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
      scrollStartTimeRef.current = null;
      isScrollPausedRef.current = false;
    }
    setIsAutoScrolling(false);
  }, []);
  
  // Fonction pour gérer la pause temporaire (bouton flottant)
  const handlePauseScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      isScrollPausedRef.current = true;
    }
  }, []);
  
  // Fonction pour reprendre le défilement (bouton flottant)
  const handleResumeScroll = useCallback(() => {
    if (scrollIntervalRef.current && !isManuallyPaused) {
      isScrollPausedRef.current = false;
    }
  }, [isManuallyPaused]);
  
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
  
  // Nettoyer l'intervalle lors du démontage du composant
  useEffect(() => {
    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
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
