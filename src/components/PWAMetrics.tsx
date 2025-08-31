import { usePWAAnalytics } from '@/hooks/usePWAAnalytics';

export const usePWAMetrics = () => {
  const analytics = usePWAAnalytics();

  return {
    trackInstall: () => analytics.track('pwa_install_prompt_shown'),
    trackOfflineUsage: () => analytics.track('pwa_offline_usage'),
    trackPerformance: (name: string, duration: number) => 
      analytics.track('pwa_performance', { name, value: duration }),
    ...analytics
  };
};