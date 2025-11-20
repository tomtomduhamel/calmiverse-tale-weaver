
import React, { useEffect, lazy, Suspense } from "react";
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
import { notificationService } from "@/services/notifications/NotificationService";

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

// Fallback minimaliste pour Suspense
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: 'var(--background)',
    color: 'var(--foreground)'
  }}>
    <div>Chargement...</div>
  </div>
);

function App() {
  // Commented out for testing - usePreloadRoutes();
  
  // Initialize notification system
  useEffect(() => {
    const initNotifications = async () => {
      if (notificationService.isSupported()) {
        console.log('[App] Initializing notification system...');
        await notificationService.requestPermission();
      } else {
        console.warn('[App] Notifications not supported on this device');
      }
    };
    
    initNotifications();
  }, []);
  
  return (
    <ErrorBoundary>
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
    </ErrorBoundary>
  );
}

export default App;
