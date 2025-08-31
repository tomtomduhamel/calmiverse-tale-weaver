import { useEffect } from 'react';

interface PWAMetrics {
  trackInstall: () => void;
  trackOfflineUsage: () => void;
  trackPerformance: (name: string, duration: number) => void;
}

export const usePWAMetrics = (): PWAMetrics => {
  useEffect(() => {
    // Track PWA installation
    const handleAppInstalled = () => {
      console.log('PWA: App installed');
      // Here you would send to your analytics service
      // analytics.track('pwa_installed', { timestamp: Date.now() });
    };

    // Track offline usage
    const handleOfflineUsage = () => {
      if (!navigator.onLine) {
        console.log('PWA: Offline usage detected');
        // analytics.track('pwa_offline_usage', { timestamp: Date.now() });
      }
    };

    // Performance tracking
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming;
          console.log('PWA Performance:', {
            loadTime: navEntry.loadEventEnd - navEntry.fetchStart,
            domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.fetchStart,
            firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
          });
        }
      });
    });

    observer.observe({ entryTypes: ['navigation'] });

    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('load', handleOfflineUsage);

    return () => {
      observer.disconnect();
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('load', handleOfflineUsage);
    };
  }, []);

  const trackInstall = () => {
    console.log('PWA: Install prompt shown');
    // analytics.track('pwa_install_prompt_shown', { timestamp: Date.now() });
  };

  const trackOfflineUsage = () => {
    console.log('PWA: Offline usage tracked');
    // analytics.track('pwa_offline_action', { timestamp: Date.now() });
  };

  const trackPerformance = (name: string, duration: number) => {
    console.log(`PWA Performance ${name}:`, duration);
    // analytics.track('pwa_performance', { name, duration, timestamp: Date.now() });
  };

  return {
    trackInstall,
    trackOfflineUsage,
    trackPerformance
  };
};