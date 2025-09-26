
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { ThemeProvider } from 'next-themes'
import CriticalErrorBoundary from './components/CriticalErrorBoundary.tsx'
import WhiteScreenProtector from './components/ui/WhiteScreenProtector.tsx'

// Add PWA service worker cleanup first
const cleanupOldServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (let registration of registrations) {
        console.log('🔧 [SW-Cleanup] Unregistering old service worker...');
        await registration.unregister();
      }
      if (registrations.length > 0) {
        console.log('♻️ [SW-Cleanup] Reloading to clear service worker cache...');
        window.location.reload();
        return;
      }
    } catch (error) {
      console.warn('[SW-Cleanup] Could not cleanup service workers:', error);
    }
  }
};

// Initialize app with white screen protection
console.log('🚀 [Calmi] Initializing main application...');

cleanupOldServiceWorker().then(() => {
  console.log('📱 [Calmi] Mounting React application...');
  
  // Hide initial loading screen
  document.body.classList.add('react-mounted');
  
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <CriticalErrorBoundary>
        <WhiteScreenProtector>
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
        </WhiteScreenProtector>
      </CriticalErrorBoundary>
    </React.StrictMode>,
  );
});
