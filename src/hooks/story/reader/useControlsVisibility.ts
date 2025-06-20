
import { useState, useEffect } from 'react';

interface UseControlsVisibilityOptions {
  persistState?: boolean;
}

export const useControlsVisibility = (options: UseControlsVisibilityOptions = {}) => {
  const { persistState = true } = options;
  
  // Récupérer l'état persisté ou utiliser true par défaut
  const getInitialState = () => {
    if (!persistState) return true;
    const saved = localStorage.getItem('storyReader.controlsVisible');
    return saved !== null ? JSON.parse(saved) : true;
  };

  const [isVisible, setIsVisible] = useState(getInitialState);

  // Persister l'état
  useEffect(() => {
    if (persistState) {
      localStorage.setItem('storyReader.controlsVisible', JSON.stringify(isVisible));
    }
  }, [isVisible, persistState]);

  // Toggle manuel de la visibilité
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return {
    isVisible,
    toggleVisibility
  };
};
