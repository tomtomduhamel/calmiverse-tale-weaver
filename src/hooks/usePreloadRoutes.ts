import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Route preloading mappings
const ROUTE_PRELOAD_MAP: Record<string, string[]> = {
  '/': ['/library', '/create-story'],
  '/library': ['/create-story', '/kids'],
  '/create-story': ['/create-story/step-1', '/create-story/step-2'],
  '/kids': ['/kids/new'],
  '/auth': ['/']
};

export const usePreloadRoutes = () => {
  const location = useLocation();

  useEffect(() => {
    const currentPath = location.pathname;
    const routesToPreload = ROUTE_PRELOAD_MAP[currentPath] || [];

    if (routesToPreload.length === 0) return;

    // Preload routes after a delay to not interfere with current navigation
    const timer = setTimeout(() => {
      routesToPreload.forEach(route => {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = route;
        document.head.appendChild(link);
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  const preloadRoute = (route: string) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  };

  return { preloadRoute };
};