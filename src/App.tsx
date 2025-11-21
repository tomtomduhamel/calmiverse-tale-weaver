
import React, { useEffect, lazy, Suspense, useState } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';

// CRITICAL: Imports synchrones pour le boot initial uniquement
import Auth from './pages/Auth';
import Index from './pages/Index';
import Shell from "./components/Shell";
import NotFound from './pages/NotFound';
import ErrorBoundary from "@/components/ErrorBoundary";
import { ErrorListener } from "@/components/ErrorListener";
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { DemoBanner } from "@/components/DemoBanner";
import { notificationService } from "@/services/notifications/NotificationService";
import { bootMonitor } from "@/utils/bootMonitor";

// OPTIMIZED: Lazy loading pour toutes les routes secondaires
const ChildrenListPage = lazy(() => import('./pages/ChildrenListPage'));
const KidsProfile = lazy(() => import('./pages/KidsProfile'));
const Settings = lazy(() => import('./pages/Settings'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/legal/TermsOfService').then(m => ({ default: m.TermsOfService })));
const NewPrivacyPolicy = lazy(() => import('./pages/legal/PrivacyPolicy').then(m => ({ default: m.PrivacyPolicy })));
const CookiePolicy = lazy(() => import('./pages/legal/CookiePolicy').then(m => ({ default: m.CookiePolicy })));
const SharedStory = lazy(() => import('./pages/SharedStory'));
const PublicStory = lazy(() => import('./pages/PublicStory'));
const CreateStoryTitles = lazy(() => import("./pages/CreateStoryTitles"));
const CreateStoryStep1 = lazy(() => import("./pages/CreateStoryStep1"));
const CreateStoryStep2 = lazy(() => import("./pages/CreateStoryStep2"));
const Library = lazy(() => import("./pages/Library"));
const StoryReaderPage = lazy(() => import("./pages/StoryReaderPage"));
const PromptAdmin = lazy(() => import('./pages/admin/PromptAdmin'));
const AdminGuard = lazy(() => import('./components/admin/AdminGuard'));
const Pricing = lazy(() => import('./pages/Pricing'));
const Subscription = lazy(() => import('./pages/Subscription'));
const ContactPage = lazy(() => import("@/pages/support/ContactPage").then(m => ({ default: m.ContactPage })));
const DocumentationPage = lazy(() => import("@/pages/support/DocumentationPage").then(m => ({ default: m.DocumentationPage })));
const ServiceStatusPage = lazy(() => import("@/pages/support/ServiceStatusPage").then(m => ({ default: m.ServiceStatusPage })));
const AboutPage = lazy(() => import("@/pages/AboutPage").then(m => ({ default: m.AboutPage })));
const TestConnection = lazy(() => import("./pages/TestConnection"));
const DiagnosticConnection = lazy(() => import("./pages/DiagnosticConnection"));

// PageLoader avec détection de timeout et retry
const PageLoader = () => {
  const [showError, setShowError] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    bootMonitor.log('PageLoader: Started');
    
    // Compteur de temps écoulé
    const interval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    // Timeout pour détecter chunks qui ne loadent pas
    const timer = setTimeout(() => {
      console.warn('[PageLoader] ⚠️ Chunk loading timeout (15s)');
      bootMonitor.log('PageLoader: Timeout reached');
      setShowError(true);
    }, 15000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  if (showError) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        padding: '2rem',
        textAlign: 'center'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
          Chargement lent détecté
        </div>
        <div style={{ marginBottom: '1.5rem', opacity: 0.7 }}>
          Le chargement prend plus de temps que prévu
        </div>
        <button 
          onClick={() => {
            bootMonitor.log('PageLoader: Manual reload');
            window.location.reload();
          }}
          style={{
            padding: '0.75rem 1.5rem',
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '500'
          }}
        >
          Recharger l'application
        </button>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'hsl(var(--background))',
      color: 'hsl(var(--foreground))'
    }}>
      <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>✨</div>
      <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>
        Chargement de Calmi...
      </div>
      <div style={{ fontSize: '0.875rem', opacity: 0.6 }}>
        {elapsed > 0 && `${elapsed}s écoulées`}
      </div>
      <div style={{ marginTop: '1rem', fontSize: '0.875rem', opacity: 0.5 }}>
        Cela peut prendre quelques instants sur mobile
      </div>
    </div>
  );
};

function App() {
  const isDemoMode = (window as any).__CALMI_DEMO_MODE === true;
  
  useEffect(() => {
    bootMonitor.log('App: Component mounted');
    if (isDemoMode) {
      console.log('🎭 [App] Mode démo actif - Fonctionnalités limitées');
    }
  }, [isDemoMode]);

  // Initialize notification system
  useEffect(() => {
    const initNotifications = async () => {
      if (notificationService.isSupported()) {
        console.log('[App] Initializing notification system...');
        bootMonitor.log('App: Init notifications');
        await notificationService.requestPermission();
      } else {
        console.warn('[App] Notifications not supported on this device');
      }
    };
    
    initNotifications();
  }, []);

  return (
    <ErrorBoundary>
      {isDemoMode && <DemoBanner />}
      <div className={isDemoMode ? "pt-[60px]" : ""}>
        <Router>
          <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Routes publiques */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy" element={<NewPrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/documentation" element={<DocumentationPage />} />
            <Route path="/status" element={<ServiceStatusPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/shared/:token" element={<SharedStory />} />
            <Route path="/story/:id" element={<PublicStory />} />
            <Route path="/404" element={<NotFound />} />

        {/* Routes avec authentification */}
        <Route path="/" element={<Shell />}>
          <Route index element={<Index />} />
          <Route path="children" element={<ChildrenListPage />} />
          <Route path="kids-profile" element={<KidsProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="library" element={<Library />} />
          <Route path="reader/:id" element={<StoryReaderPage />} />
          {/* Route obsolète supprimée - utiliser /create-story/step-1 */}
          {/* Redirection de l'ancienne route vers la nouvelle */}
          <Route path="create-story-n8n" element={<Navigate to="/create-story/step-1" replace />} />
          <Route path="create-story-titles" element={<CreateStoryTitles />} />
          <Route path="create-story/step-1" element={<CreateStoryStep1 />} />
          <Route path="create-story/step-2" element={<CreateStoryStep2 />} />
          {/* Routes step-3 supprimée - génération en arrière-plan */}
          <Route path="pricing" element={<Pricing />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="test-connection" element={<TestConnection />} />
          <Route path="diagnostic-connection" element={<DiagnosticConnection />} />
          <Route path="admin/prompts" element={<AdminGuard><PromptAdmin /></AdminGuard>} />
        </Route>

            {/* Route de fallback */}
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </Router>

      {/* Composants globaux */}
      <ErrorListener />
      <Toaster />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <OfflineIndicator />
      </div>
    </ErrorBoundary>
  );
}

export default App;
