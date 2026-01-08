import React, { useEffect, useRef } from 'react';

interface PWAGesturesProps {
  children: React.ReactNode;
  onPullToRefresh?: () => void;
  className?: string;
}

export const PWAGestures: React.FC<PWAGesturesProps> = ({ 
  children, 
  onPullToRefresh,
  className = ""
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const startX = useRef<number>(0);
  const currentY = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isPulling = useRef<boolean>(false);
  const pullStartTime = useRef<number>(0);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollEndTime = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const lastTouchY = useRef<number>(0);
  const lastTouchTime = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onPullToRefresh) return;

    let refreshTriggered = false;
    let listenersActive = false;
    const PULL_THRESHOLD = 150;      // 150px pour un pull intentionnel
    const MIN_PULL_DURATION = 400;   // 400ms minimum
    const SCROLL_TOP_THRESHOLD = 0;  // Strictement en haut
    const SCROLL_COOLDOWN = 300;     // 300ms après un scroll

    const handleTouchStart = (e: TouchEvent) => {
      // Ne pas intercepter si on touche une carte (laisser le swipe horizontal fonctionner)
      const target = e.target as HTMLElement;
      if (target.closest('[data-swipe-card]')) {
        return;
      }
      
      // Ignorer si on vient juste de scroller (cooldown)
      if (Date.now() - scrollEndTime.current < SCROLL_COOLDOWN) {
        return;
      }
      
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
        lastTouchY.current = e.touches[0].clientY;
        lastTouchTime.current = Date.now();
        velocityRef.current = 0;
        isPulling.current = true;
        refreshTriggered = false;
        pullStartTime.current = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;

      const now = Date.now();
      const touchY = e.touches[0].clientY;
      
      // Calculer la vélocité (pixels par milliseconde)
      if (lastTouchTime.current > 0) {
        const timeDelta = now - lastTouchTime.current;
        if (timeDelta > 0) {
          const yDelta = touchY - lastTouchY.current;
          velocityRef.current = Math.abs(yDelta / timeDelta);
        }
      }
      
      lastTouchY.current = touchY;
      lastTouchTime.current = now;

      currentY.current = touchY;
      currentX.current = e.touches[0].clientX;
      
      const deltaY = currentY.current - startY.current;
      const deltaX = currentX.current - startX.current;
      const pullDuration = Date.now() - pullStartTime.current;

      // Détecter la direction dominante du mouvement (plus strict)
      const isVerticalMovement = Math.abs(deltaY) > Math.abs(deltaX) * 2;
      const isPullingDown = deltaY > 0;
      const hasMinimumMovement = Math.abs(deltaY) > 20;
      const isSlowPull = velocityRef.current < 0.8; // Vitesse lente = intentionnel

      // Ne déclencher que pour un pull LENT et INTENTIONNEL
      if (isPullingDown && isVerticalMovement && hasMinimumMovement && isSlowPull && container.scrollTop === 0) {
        e.preventDefault();
        
        // Visual feedback for pull-to-refresh
        const pullDistance = Math.min(deltaY, 180);
        const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
        
        container.style.transform = `translateY(${pullDistance * 0.2}px)`;
        container.style.opacity = (1 - opacity * 0.1).toString();

        // Trigger refresh at threshold with minimum duration
        if (pullDistance > PULL_THRESHOLD && pullDuration > MIN_PULL_DURATION && !refreshTriggered) {
          refreshTriggered = true;
          navigator.vibrate?.(50);
        }
      } else if (!isVerticalMovement || !isPullingDown || !isSlowPull) {
        isPulling.current = false;
      }
    };

    const debouncedRefresh = () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      
      debounceTimeoutRef.current = setTimeout(() => {
        onPullToRefresh();
      }, 300); // 300ms debounce
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;

      const diff = currentY.current - startY.current;
      const pullDuration = Date.now() - pullStartTime.current;
      
      if (diff > PULL_THRESHOLD && pullDuration > MIN_PULL_DURATION && refreshTriggered) {
        debouncedRefresh();
      }

      // Reset visual state
      container.style.transform = '';
      container.style.opacity = '';
      
      isPulling.current = false;
      refreshTriggered = false;
    };

    // ⚡ NOUVEAU : Gestion dynamique des listeners
    const updateListeners = () => {
      const isNearTop = container.scrollTop <= SCROLL_TOP_THRESHOLD;
      
      if (isNearTop && !listenersActive) {
        // Activer les listeners seulement en haut
        container.addEventListener('touchstart', handleTouchStart, { passive: false });
        container.addEventListener('touchmove', handleTouchMove, { passive: false });
        container.addEventListener('touchend', handleTouchEnd);
        listenersActive = true;
        console.log('[PWAGestures] Listeners activés');
      } else if (!isNearTop && listenersActive) {
        // Désactiver les listeners ailleurs
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        listenersActive = false;
        console.log('[PWAGestures] Listeners désactivés');
      }
    };

    // Initialiser les listeners si on est en haut
    updateListeners();

    // Écouter les changements de scroll pour activer/désactiver
    const handleScroll = () => {
      scrollEndTime.current = Date.now();
      updateListeners();
    };

    container.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      // Cleanup
      container.removeEventListener('scroll', handleScroll);
      if (listenersActive) {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
      }
      
      // Cleanup debounce timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [onPullToRefresh]);

  return (
    <div 
      ref={containerRef}
      className={`overscroll-behavior-contain scroll-smooth-ios ${className}`}
    >
      {children}
    </div>
  );
};