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
  const currentY = useRef<number>(0);
  const isPulling = useRef<boolean>(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onPullToRefresh) return;

    let refreshTriggered = false;

    const handleTouchStart = (e: TouchEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
        refreshTriggered = false;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling.current) return;

      currentY.current = e.touches[0].clientY;
      const diff = currentY.current - startY.current;

      if (diff > 0 && container.scrollTop === 0) {
        e.preventDefault();
        
        // Visual feedback for pull-to-refresh
        const pullDistance = Math.min(diff, 100);
        const opacity = Math.min(pullDistance / 60, 1);
        
        container.style.transform = `translateY(${pullDistance * 0.3}px)`;
        container.style.opacity = (1 - opacity * 0.2).toString();

        // Trigger refresh at threshold
        if (pullDistance > 60 && !refreshTriggered) {
          refreshTriggered = true;
          navigator.vibrate?.(50); // Haptic feedback if available
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isPulling.current) return;

      const diff = currentY.current - startY.current;
      
      if (diff > 60 && refreshTriggered && onPullToRefresh) {
        onPullToRefresh();
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