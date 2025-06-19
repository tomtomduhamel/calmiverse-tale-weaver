
import React, { useEffect } from 'react';

interface UserActivityDetectorProps {
  onActivity: () => void;
  children: React.ReactNode;
}

export const UserActivityDetector: React.FC<UserActivityDetectorProps> = ({
  onActivity,
  children
}) => {
  useEffect(() => {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = (event: Event) => {
      // Vérifier si l'événement provient du bouton toggle pour éviter les conflits
      const target = event.target as HTMLElement;
      const isToggleButton = target.closest('[data-toggle-controls]');
      
      // Ignorer l'activité du bouton toggle
      if (isToggleButton) {
        return;
      }
      
      onActivity();
    };

    // Throttle pour éviter trop d'appels
    let timeoutId: NodeJS.Timeout;
    const throttledHandler = (event: Event) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => handleActivity(event), 100);
    };

    events.forEach(event => {
      document.addEventListener(event, throttledHandler, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, throttledHandler);
      });
      clearTimeout(timeoutId);
    };
  }, [onActivity]);

  return <>{children}</>;
};
