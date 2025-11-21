import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { ThemeProvider } from 'next-themes'
import CriticalErrorBoundary from './components/CriticalErrorBoundary.tsx'
import { forceServiceWorkerReset, clearStuckMarker } from './utils/serviceWorkerReset'
import { bootMonitor } from './utils/bootMonitor'
import { logBootMode } from './utils/mobileBootOptimizer'
import { safeStorage } from './utils/safeStorage'
import App from './App.tsx'


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

// PHASE CRITIQUE: Marquer le début du montage React
(window as any).__CALMI_MAIN_START = Date.now();
bootMonitor.log('main.tsx: React about to mount');
console.log('📱 [Calmi] BOOT_STAGE: main.tsx loaded, React about to mount');

// CRITICAL: Mount React app IMMEDIATELY - never block on async operations
console.log('📱 [Calmi] Mounting React application NOW...');

// Hide initial loading screen immediately
document.body.classList.add('react-mounted');

// Mount React app immediately (synchronous App.tsx for instant boot)
const rootElement = document.getElementById('root')!;
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <CriticalErrorBoundary>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem={true}
        storageKey="calmi-theme"
      >
        <SupabaseAuthProvider>
          <App />
        </SupabaseAuthProvider>
      </ThemeProvider>
    </CriticalErrorBoundary>
  </React.StrictMode>,
);

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
