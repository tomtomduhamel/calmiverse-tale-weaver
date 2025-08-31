import { useState, useEffect } from 'react';
import { usePWA } from '@/hooks/usePWA';
import { useNotifications } from '@/hooks/useNotifications';
import { usePWAMetrics } from '@/components/PWAMetrics';

interface PWAStatus {
  isFullyOptimized: boolean;
  features: {
    installed: boolean;
    offline: boolean;
    notifications: boolean;
    caching: boolean;
    updateAvailable: boolean;
  };
  score: number;
  recommendations: string[];
}

export const usePWAStatus = (): PWAStatus => {
  const { isInstalled, isOnline, updateAvailable } = usePWA();
  const { permission, isSupported } = useNotifications();
  const { metrics } = usePWAMetrics();

  const [status, setStatus] = useState<PWAStatus>({
    isFullyOptimized: false,
    features: {
      installed: false,
      offline: false,
      notifications: false,
      caching: false,
      updateAvailable: false
    },
    score: 0,
    recommendations: []
  });

  useEffect(() => {
    const features = {
      installed: isInstalled,
      offline: 'serviceWorker' in navigator,
      notifications: permission === 'granted',
      caching: 'caches' in window,
      updateAvailable: updateAvailable
    };

    const recommendations: string[] = [];
    
    if (!features.installed) {
      recommendations.push('Installer l\'application pour une meilleure expérience');
    }
    
    if (!features.notifications && isSupported) {
      recommendations.push('Activer les notifications pour ne rien manquer');
    }
    
    if (updateAvailable) {
      recommendations.push('Une mise à jour est disponible');
    }

    // Calcul du score PWA (sur 100)
    let score = 0;
    if (features.offline) score += 30; // Service Worker
    if (features.caching) score += 20; // Cache API
    if (features.installed) score += 25; // Installation
    if (features.notifications) score += 15; // Notifications
    if (!updateAvailable) score += 10; // Pas de mise à jour en attente

    const isFullyOptimized = score >= 85 && features.installed && features.notifications;

    setStatus({
      isFullyOptimized,
      features,
      score,
      recommendations
    });
  }, [isInstalled, isOnline, permission, isSupported, updateAvailable]);

  return status;
};