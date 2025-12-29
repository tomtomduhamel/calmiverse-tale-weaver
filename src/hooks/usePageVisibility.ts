import { useEffect, useRef, useCallback } from 'react';

interface VisibilityCallbacks {
  onHide?: () => void;
  onShow?: () => void;
}

/**
 * Hook réutilisable pour gérer les événements de visibilité de page.
 * Utile pour sauvegarder l'état avant que l'app passe en background
 * et restaurer/vérifier l'état quand l'app redevient visible.
 */
export const usePageVisibility = (callbacks: VisibilityCallbacks) => {
  const callbacksRef = useRef(callbacks);
  
  // Mettre à jour la ref quand les callbacks changent
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        console.log('[usePageVisibility] Page hidden - sauvegarde');
        callbacksRef.current.onHide?.();
      } else if (document.visibilityState === 'visible') {
        console.log('[usePageVisibility] Page visible - restauration');
        callbacksRef.current.onShow?.();
      }
    };

    // Aussi gérer beforeunload pour les fermetures de page
    const handleBeforeUnload = () => {
      console.log('[usePageVisibility] beforeunload - sauvegarde finale');
      callbacksRef.current.onHide?.();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  // Exposer une fonction pour forcer la sauvegarde manuelle
  const forceSave = useCallback(() => {
    callbacksRef.current.onHide?.();
  }, []);

  return { forceSave };
};

export default usePageVisibility;
