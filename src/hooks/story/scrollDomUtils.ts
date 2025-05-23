
import { useCallback } from "react";

export const useScrollDomUtils = (scrollAreaRef: React.RefObject<HTMLDivElement>) => {
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

  // Faire défiler vers une position spécifique
  const scrollToPosition = useCallback((position: number) => {
    const viewportEl = getViewportElement();
    if (viewportEl) {
      viewportEl.scrollTop = position;
    }
  }, [getViewportElement]);

  return {
    getViewportElement,
    scrollToPosition
  };
};
