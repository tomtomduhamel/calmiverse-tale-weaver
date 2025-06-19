
import { useState, useEffect, useRef, useCallback } from 'react';

interface UseControlsVisibilityOptions {
  autoHideDelay?: number;
  persistState?: boolean;
}

export const useControlsVisibility = (options: UseControlsVisibilityOptions = {}) => {
  const { autoHideDelay = 5000, persistState = true } = options;
  
  // Récupérer l'état persisté ou utiliser true par défaut
  const getInitialState = () => {
    if (!persistState) return true;
    const saved = localStorage.getItem('storyReader.controlsVisible');
    return saved !== null ? JSON.parse(saved) : true;
  };

  const [isVisible, setIsVisible] = useState(getInitialState);
  const [isUserInteracting, setIsUserInteracting] = useState(false);
  const [isInGracePeriod, setIsInGracePeriod] = useState(false);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const graceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Persister l'état
  useEffect(() => {
    if (persistState) {
      localStorage.setItem('storyReader.controlsVisible', JSON.stringify(isVisible));
    }
  }, [isVisible, persistState]);

  // Réinitialiser le timer de masquage automatique
  const resetAutoHideTimer = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    if (isVisible && !isUserInteracting && !isInGracePeriod) {
      hideTimeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, autoHideDelay);
    }
  }, [isVisible, isUserInteracting, isInGracePeriod, autoHideDelay]);

  // Détecter l'activité utilisateur avec vérification de la période de grâce
  const handleUserActivity = useCallback(() => {
    // Ignorer l'activité pendant la période de grâce après un toggle manuel
    if (isInGracePeriod) {
      return;
    }

    lastActivityRef.current = Date.now();
    if (!isVisible) {
      setIsVisible(true);
    }
    resetAutoHideTimer();
  }, [isVisible, isInGracePeriod, resetAutoHideTimer]);

  // Toggle manuel de la visibilité avec période de grâce
  const toggleVisibility = useCallback(() => {
    const newVisibility = !isVisible;
    setIsVisible(newVisibility);
    
    // Démarrer une période de grâce de 2 secondes pour éviter la réapparition immédiate
    setIsInGracePeriod(true);
    
    if (graceTimeoutRef.current) {
      clearTimeout(graceTimeoutRef.current);
    }
    
    graceTimeoutRef.current = setTimeout(() => {
      setIsInGracePeriod(false);
    }, 2000);

    // Empêcher le masquage automatique pendant un court moment après un toggle manuel
    setIsUserInteracting(true);
    setTimeout(() => setIsUserInteracting(false), 3000);
  }, [isVisible]);

  // Afficher temporairement les contrôles
  const showTemporarily = useCallback(() => {
    if (isInGracePeriod) return; // Respecter la période de grâce
    
    setIsVisible(true);
    resetAutoHideTimer();
  }, [isInGracePeriod, resetAutoHideTimer]);

  // Forcer l'affichage (utile quand l'utilisateur interagit avec les contrôles)
  const keepVisible = useCallback(() => {
    setIsUserInteracting(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  // Permettre le masquage automatique
  const allowAutoHide = useCallback(() => {
    setIsUserInteracting(false);
    resetAutoHideTimer();
  }, [resetAutoHideTimer]);

  // Nettoyer les timers au démontage
  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
      if (graceTimeoutRef.current) {
        clearTimeout(graceTimeoutRef.current);
      }
    };
  }, []);

  // Démarrer le timer initial
  useEffect(() => {
    resetAutoHideTimer();
  }, [resetAutoHideTimer]);

  return {
    isVisible,
    toggleVisibility,
    showTemporarily,
    handleUserActivity,
    keepVisible,
    allowAutoHide
  };
};
