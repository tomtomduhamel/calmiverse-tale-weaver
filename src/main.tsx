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
import App from './App.tsx'

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


// 🔧 PHASE 3: Diagnostic des chunks chargés
console.log('🔧 [Boot] Chunks loaded:', {
  react: typeof React !== 'undefined',
  reactDOM: typeof ReactDOM !== 'undefined',
  safeThemeProvider: typeof SafeThemeProvider !== 'undefined',
  timestamp: Date.now(),
  userAgent: navigator.userAgent.slice(0, 80)
});

// Helper to detect Lovable preview iframe
const isPreviewIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

// Initialize app with white screen protection
bootMonitor.log('main.tsx: Starting');
logBootMode();
console.log('🚀 [Calmi] Initializing main application...');

// PHASE 4: Détecter le mode safe et le mode démo
const urlParams = new URLSearchParams(window.location.search);
const isSafeMode = urlParams.get('safe-mode') === '1';
const isDemoMode = urlParams.get('demo') === '1';

if (isSafeMode) {
  (window as any).__CALMI_SAFE_MODE = true;
  console.log('🛡️ [Calmi] MODE SAFE ACTIVÉ - Pas de ThemeProvider');
}

if (isDemoMode) {
  (window as any).__CALMI_DEMO_MODE = true;
  console.log('🎭 [Calmi] MODE DÉMO ACTIVÉ - Données d\'exemple uniquement');
}

// PHASE CRITIQUE: Marquer le début du montage React
(window as any).__CALMI_MAIN_START = Date.now();
bootMonitor.log('main.tsx: React about to mount');
console.log('📱 [Calmi] BOOT_STAGE: main.tsx loaded, React about to mount');

if (isDemoMode) {
  console.log('🎭 [Calmi] Mode démo - Skip auth & use mock data');
}

// CRITICAL: Mount React app IMMEDIATELY - never block on async operations
console.log('📱 [Calmi] Mounting React application NOW...');

// Hide initial loading screen immediately
document.body.classList.add('react-mounted');

// Mount React app immediately (synchronous App.tsx for instant boot)
const rootElement = document.getElementById('root')!;

// 🛡️ PHASE 4: Rendu conditionnel selon le mode safe
if (isSafeMode) {
  console.log('🛡️ [Calmi] Rendu sans ThemeProvider (mode safe)');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <CriticalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SupabaseAuthProvider>
            <App />
          </SupabaseAuthProvider>
        </QueryClientProvider>
      </CriticalErrorBoundary>
    </React.StrictMode>,
  );
} else {
  console.log('🎨 [Calmi] Rendu normal avec SafeThemeProvider');
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <CriticalErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <SafeThemeProvider>
            <SupabaseAuthProvider>
              <App />
            </SupabaseAuthProvider>
          </SafeThemeProvider>
        </QueryClientProvider>
      </CriticalErrorBoundary>
    </React.StrictMode>,
  );
}

// React est monté avec succès
bootMonitor.log('React: Mounted successfully');
console.log('✅ [Calmi] React application mounted successfully');

// PHASE 2: Supprimer emergency loader une fois React monté
const emergencyLoader = document.getElementById('emergency-loader');
if (emergencyLoader) {
  emergencyLoader.remove();
  console.log('✅ [Emergency] Loader supprimé - React monté avec succès');
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
  if (isPreviewIframe() || (window as any).__CALMI_PREVIEW_MODE) {
    safeStorage.setItem('calmi_safe_mode', '1');
    console.log('🧪 [Calmi] Preview mode detected - skipping SW reset');
    return;
  }

  // Execute SW reset in background (non-blocking, fire-and-forget)
  forceServiceWorkerReset().catch(e => {
    console.warn('[SW-Reset] Background reset failed:', e);
  });
}, 0);
