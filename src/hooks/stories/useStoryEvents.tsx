
import { useEffect } from 'react';

export const useStoryEvents = (setLastError: (error: string | null) => void, setIsRetrying: (isRetrying: boolean) => void) => {
  // Listen for application-level events
  useEffect(() => {
    const handleAppNotification = (event: CustomEvent) => {
      if (event.detail.type === 'error') {
        setLastError(event.detail.message);
      } else if (event.detail.type === 'success') {
        setLastError(null);
      } else if (event.detail.type === 'retry') {
        setIsRetrying(true);
      }
    };
    
    document.addEventListener('app-notification', handleAppNotification as EventListener);
    
    return () => {
      document.removeEventListener('app-notification', handleAppNotification as EventListener);
    };
  }, [setLastError, setIsRetrying]);
};
