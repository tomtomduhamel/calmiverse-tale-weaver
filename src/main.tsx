import React from 'react'
import ReactDOM from 'react-dom/client'

// Expose React for diagnostic tools
(window as any).React = React;
(window as any).ReactDOM = ReactDOM;
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { SafeThemeProvider } from './components/SafeThemeProvider.tsx'
import CriticalErrorBoundary from './components/CriticalErrorBoundary.tsx'
import { forceServiceWorkerReset, clearStuckMarker } from './utils/serviceWorkerReset'
import { bootMonitor } from './utils/bootMonitor'
import { logBootMode } from './utils/mobileBootOptimizer'
import { safeStorage } from './utils/safeStorage'
import { initSentry } from './config/sentryConfig'
import App from './App.tsx'

// Initialisation du monitoring d'erreurs au plus tôt
initSentry();

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (anciennement cacheTime)
      retry: 2,
      retryDelay: 1000,
    },
  },
})


// Initializing application...
bootMonitor.log('main.tsx: Starting');
logBootMode();
console.log('🚀 [Calmi] Initializing main application...');

// Detect special boot modes
const urlParams = new URLSearchParams(window.location.search);
const isSafeMode = urlParams.get('safe-mode') === '1';
const isDemoMode = urlParams.get('demo') === '1';

if (isSafeMode) {
  (window as any).__CALMI_SAFE_MODE = true;
  console.log('🛡️ [Calmi] SAFE MODE - No ThemeProvider');
}

if (isDemoMode) {
  (window as any).__CALMI_DEMO_MODE = true;
  console.log('🎭 [Calmi] DEMO MODE - Using mock data');
}

bootMonitor.log('main.tsx: React about to mount');

// Mount React app
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CriticalErrorBoundary>
      <QueryClientProvider client={queryClient}>
        {isSafeMode ? (
          <SupabaseAuthProvider>
            <App />
          </SupabaseAuthProvider>
        ) : (
          <SafeThemeProvider>
            <SupabaseAuthProvider>
              <App />
            </SupabaseAuthProvider>
          </SafeThemeProvider>
        )}
      </QueryClientProvider>
    </CriticalErrorBoundary>
  </React.StrictMode>,
);

// Cleanup loader when React mounts
const rootLoader = document.getElementById('root-loader');
if (rootLoader) {
  rootLoader.style.opacity = '0';
  setTimeout(() => rootLoader.remove(), 500);
}

// CRITICAL: Clear stuck marker AFTER React is mounted (safe storage access)
clearStuckMarker();

// ============================================================================
// POST-MOUNT OPERATIONS: Cleanup asynchrone après le montage de React
// ============================================================================
setTimeout(() => {
  const bootEndTime = Date.now();
  const bootDuration = bootEndTime - (window as any).__CALMI_MAIN_START;
  bootMonitor.log(`React mount completed (${bootDuration}ms)`);
  console.log(`⏱️ [Calmi] React mounted in ${bootDuration}ms`);

  // Afficher le rapport de boot complet
  bootMonitor.report();

  // Skip SW reset in preview iframe or preview mode
  if ((window.self !== window.top) || (window as any).__CALMI_PREVIEW_MODE) {
    safeStorage.setItem('calmi_safe_mode', '1');
    console.log('🧪 [Calmi] Preview mode detected - skipping SW reset');
    return;
  }

  // Execute SW reset in background (non-blocking, fire-and-forget)
  forceServiceWorkerReset().catch(e => {
    console.warn('[SW-Reset] Background reset failed:', e);
  });
}, 0);
