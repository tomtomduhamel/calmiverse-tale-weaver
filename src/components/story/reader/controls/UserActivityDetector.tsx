
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
    
    const handleActivity = () => {
      onActivity();
    };

    // Throttle pour éviter trop d'appels
    let timeoutId: NodeJS.Timeout;
    const throttledHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleActivity, 100);
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
