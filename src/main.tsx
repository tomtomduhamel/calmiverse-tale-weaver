
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { ThemeProvider } from 'next-themes'
import CriticalErrorBoundary from './components/CriticalErrorBoundary.tsx'
import { forceServiceWorkerReset, clearStuckMarker } from './utils/serviceWorkerReset'

// PHASE 1: Service Worker Cleanup Radical avec flag localStorage
const cleanupOldServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const SW_CLEANUP_FLAG = 'calmi-sw-cleaned-v2';
    const hasBeenCleaned = localStorage.getItem(SW_CLEANUP_FLAG);
    
    // Ne nettoyer qu'une seule fois pour éviter les boucles infinies
    if (hasBeenCleaned === 'true') {
      console.log('✅ [SW-Cleanup] Service Worker déjà nettoyé');
      return;
    }
    
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      
      if (registrations.length > 0) {
        console.log('🔧 [SW-Cleanup] Désinstallation COMPLÈTE de tous les Service Workers...');
        
        for (let registration of registrations) {
          await registration.unregister();
        }
        
        // Marquer comme nettoyé AVANT le rechargement
        localStorage.setItem(SW_CLEANUP_FLAG, 'true');
        
        console.log('♻️ [SW-Cleanup] Rechargement pour activer la navigation client-side...');
        window.location.reload();
        return;
      } else {
        // Pas de SW, marquer comme nettoyé
        localStorage.setItem(SW_CLEANUP_FLAG, 'true');
        console.log('✅ [SW-Cleanup] Aucun Service Worker détecté');
      }
    } catch (error) {
      console.warn('[SW-Cleanup] Erreur lors du nettoyage:', error);
      // En cas d'erreur, marquer quand même comme nettoyé pour éviter le blocage
      localStorage.setItem(SW_CLEANUP_FLAG, 'true');
    }
  }
};

// Initialize app with white screen protection
console.log('🚀 [Calmi] Initializing main application...');

// CRITICAL: Mount React app IMMEDIATELY - never block on async operations
console.log('📱 [Calmi] Mounting React application NOW...');

// Hide initial loading screen immediately
document.body.classList.add('react-mounted');

// Clear stuck marker une fois que l'app est prête
clearStuckMarker();

// Mount React app immediately - NON BLOQUANT
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
          <App />
        </SupabaseAuthProvider>
      </ThemeProvider>
    </CriticalErrorBoundary>
  </React.StrictMode>,
);

// Run Service Worker reset in background (non-blocking)
setTimeout(() => {
  forceServiceWorkerReset().then((result) => {
    if (result.needsReload) {
      console.log('[Calmi] 💡 Mise à jour disponible - Reload conseillé (mais pas forcé)');
      // Optionnel: dispatch un event pour afficher un banner de mise à jour
      window.dispatchEvent(new CustomEvent('calmi-update-available'));
    }
  }).catch((e) => {
    console.warn('[SW-Reset] Background reset failed:', e);
  });

  // Run cleanup in background (may trigger one-time reload)
  cleanupOldServiceWorker().catch((e) => {
    console.warn('[SW-Cleanup] Background cleanup failed:', e);
  });
}, 0);
