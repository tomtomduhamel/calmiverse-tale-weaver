import { useState, useEffect, useCallback } from 'react';

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  timestamp: number;
}

interface PWAMetrics {
  installPromptShown: number;
  installCompleted: number;
  offlineUsage: number;
  performanceMetrics: Array<{
    name: string;
    value: number;
    timestamp: number;
  }>;
}

const ANALYTICS_STORAGE_KEY = 'calmi-pwa-analytics';
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 seconds

export const usePWAAnalytics = () => {
  const [metrics, setMetrics] = useState<PWAMetrics>({
    installPromptShown: 0,
    installCompleted: 0,
    offlineUsage: 0,
    performanceMetrics: []
  });
  
  const [eventQueue, setEventQueue] = useState<AnalyticsEvent[]>([]);

  // Load analytics from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        setMetrics(data);
      } catch (error) {
        console.error('Error loading analytics data:', error);
      }
    }
  }, []);

  // Save analytics to localStorage
  const saveMetrics = useCallback((newMetrics: PWAMetrics) => {
    try {
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(newMetrics));
      setMetrics(newMetrics);
    } catch (error) {
      console.error('Error saving analytics data:', error);
    }
  }, []);

  // Track events
  const track = useCallback((eventName: string, properties?: Record<string, any>) => {
    const event: AnalyticsEvent = {
      name: eventName,
      properties,
      timestamp: Date.now()
    };

    setEventQueue(prev => [...prev, event]);

    // Update metrics based on event type
    switch (eventName) {
      case 'pwa_install_prompt_shown':
        setMetrics(prev => {
          const updated = { ...prev, installPromptShown: prev.installPromptShown + 1 };
          saveMetrics(updated);
          return updated;
        });
        break;
      
      case 'pwa_installed':
        setMetrics(prev => {
          const updated = { ...prev, installCompleted: prev.installCompleted + 1 };
          saveMetrics(updated);
          return updated;
        });
        break;
      
      case 'pwa_offline_usage':
        setMetrics(prev => {
          const updated = { ...prev, offlineUsage: prev.offlineUsage + 1 };
          saveMetrics(updated);
          return updated;
        });
        break;
      
      case 'pwa_performance':
        if (properties?.name && properties?.value) {
          setMetrics(prev => {
            const performanceEntry = {
              name: properties.name,
              value: properties.value,
              timestamp: Date.now()
            };
            const updated = {
              ...prev,
              performanceMetrics: [...prev.performanceMetrics.slice(-49), performanceEntry]
            };
            saveMetrics(updated);
            return updated;
          });
        }
        break;
    }

    console.log('PWA Analytics:', eventName, properties);
  }, [saveMetrics]);

  // Flush events (in a real app, send to analytics service)
  const flushEvents = useCallback(async () => {
    if (eventQueue.length === 0) return;

    try {
      // In a real implementation, send to your analytics service
      console.log('Flushing analytics events:', eventQueue);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setEventQueue([]);
    } catch (error) {
      console.error('Error flushing analytics events:', error);
    }
  }, [eventQueue]);

  // Auto-flush events
  useEffect(() => {
    if (eventQueue.length >= BATCH_SIZE) {
      flushEvents();
    }
  }, [eventQueue, flushEvents]);

  useEffect(() => {
    const interval = setInterval(flushEvents, FLUSH_INTERVAL);
    return () => clearInterval(interval);
  }, [flushEvents]);

  // Core Web Vitals tracking
  const trackWebVitals = useCallback(() => {
    // First Contentful Paint
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.entryType === 'paint' && entry.name === 'first-contentful-paint') {
          track('pwa_performance', { name: 'FCP', value: entry.startTime });
        }
      });
    });
    
    try {
      observer.observe({ entryTypes: ['paint'] });
    } catch (error) {
      console.warn('Performance observer not supported');
    }

    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      track('pwa_performance', { name: 'LCP', value: lastEntry.startTime });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP observer not supported');
    }

    return () => {
      observer.disconnect();
      lcpObserver.disconnect();
    };
  }, [track]);

  useEffect(() => {
    const cleanup = trackWebVitals();
    return cleanup;
  }, [trackWebVitals]);

  return {
    metrics,
    track,
    flushEvents,
    eventQueue: eventQueue.length
  };
};