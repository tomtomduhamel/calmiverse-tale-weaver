import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { ThemeProvider } from 'next-themes'
import CriticalErrorBoundary from './components/CriticalErrorBoundary.tsx'
import { forceServiceWorkerReset, clearStuckMarker } from './utils/serviceWorkerReset'
import { isMobilePreviewSafeMode, logSafeMode } from './utils/safeMode'

// Lazy load App for mobile preview performance
const App = React.lazy(() => import('./App.tsx'))

// Minimal fallback loader
const SuspenseFallback = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'linear-gradient(180deg, #D6EAF8 0%, #C9E4DE 50%, #F1FAEE 100%)',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#457B9D'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
      <div>Chargement de Calmi...</div>
    </div>
  </div>
)

// Helper to detect Lovable preview iframe
const isPreviewIframe = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
};

// Initialize app with white screen protection
console.log('🚀 [Calmi] Initializing main application...');
logSafeMode('Mobile Preview Safe Mode ACTIVE');

// PHASE CRITIQUE: Marquer le début du montage React
(window as any).__CALMI_MAIN_START = Date.now();
console.log('📱 [Calmi] BOOT_STAGE: main.tsx loaded, React about to mount');

// CRITICAL: Mount React app IMMEDIATELY - never block on async operations
console.log('📱 [Calmi] Mounting React application NOW...');

// Hide initial loading screen immediately
document.body.classList.add('react-mounted');

// Clear stuck marker une fois que l'app est prête
clearStuckMarker();

// CRITICAL: Set boot OK flag BEFORE React mount to prevent recovery overlay
localStorage.setItem('calmi_boot_ok', '1');
console.log('✅ [Calmi] Boot flag set before React mount');

// Mount React app immediately with Suspense fallback for mobile preview
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CriticalErrorBoundary>
      <ThemeProvider 
        attribute="class" 
        defaultTheme="system" 
        enableSystem={true}
        storageKey="calmi-theme"
      >
        <SupabaseAuthProvider>
          <React.Suspense fallback={<SuspenseFallback />}>
            <App />
          </React.Suspense>
        </SupabaseAuthProvider>
      </ThemeProvider>
    </CriticalErrorBoundary>
  </React.StrictMode>,
);

// ============================================================================
// POST-MOUNT OPERATIONS: Cleanup asynchrone après le montage de React
// ============================================================================
setTimeout(() => {
  const bootEndTime = Date.now();
  const bootDuration = bootEndTime - (window as any).__CALMI_MAIN_START;
  console.log(`⏱️ [Calmi] React mounted in ${bootDuration}ms`);
  
  // Skip SW reset in preview iframe
  if (isPreviewIframe()) {
    try { localStorage.setItem('calmi_safe_mode','1'); } catch {}
    console.log('🧪 [Calmi] Preview iframe detected - skipping SW reset');
    return;
  }

  // Execute SW reset in background (non-blocking, fire-and-forget)
  forceServiceWorkerReset().catch(e => {
    console.warn('[SW-Reset] Background reset failed:', e);
  });
}, 0);
