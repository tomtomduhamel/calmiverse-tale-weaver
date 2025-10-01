
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/scrollbar.css'
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext.tsx'
import { ThemeProvider } from 'next-themes'
import CriticalErrorBoundary from './components/CriticalErrorBoundary.tsx'
import WhiteScreenProtector from './components/ui/WhiteScreenProtector.tsx'

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
