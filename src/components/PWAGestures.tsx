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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onPullToRefresh) return;

    let refreshTriggered = false;
    const PULL_THRESHOLD = 80; // Increased from 60px
    const MIN_PULL_DURATION = 200; // Minimum pull duration in ms

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
        isPulling.current = true;
        refreshTriggered = false;
        pullStartTime.current = Date.now();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;

      currentY.current = e.touches[0].clientY;
      currentX.current = e.touches[0].clientX;
      
      const deltaY = currentY.current - startY.current;
      const deltaX = currentX.current - startX.current;
      const pullDuration = Date.now() - pullStartTime.current;

      // Détecter la direction dominante du mouvement
      const isVerticalMovement = Math.abs(deltaY) > Math.abs(deltaX);
      const isPullingDown = deltaY > 0;
      const hasMinimumMovement = Math.abs(deltaY) > 10;

      // Ne bloquer le scroll QUE pour un pull-to-refresh légitime (mouvement vertical vers le bas)
      if (isPullingDown && isVerticalMovement && hasMinimumMovement && container.scrollTop === 0) {
        e.preventDefault(); // Bloquer SEULEMENT pour pull-to-refresh
        
        // Visual feedback for pull-to-refresh
        const pullDistance = Math.min(deltaY, 120);
        const opacity = Math.min(pullDistance / PULL_THRESHOLD, 1);
        
        container.style.transform = `translateY(${pullDistance * 0.25}px)`;
        container.style.opacity = (1 - opacity * 0.15).toString();

        // Trigger refresh at threshold with minimum duration
        if (pullDistance > PULL_THRESHOLD && pullDuration > MIN_PULL_DURATION && !refreshTriggered) {
          refreshTriggered = true;
          navigator.vibrate?.(50); // Haptic feedback if available
        }
      } else if (!isVerticalMovement || !isPullingDown) {
        // Si ce n'est pas un pull vers le bas, réinitialiser l'état
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

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
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