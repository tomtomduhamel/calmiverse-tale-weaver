
import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import ChildrenListPage from './pages/ChildrenListPage';
import KidsProfile from './pages/KidsProfile';
import Settings from './pages/Settings';

import PrivacyPolicy from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/legal/TermsOfService';
import { PrivacyPolicy as NewPrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { CookiePolicy } from './pages/legal/CookiePolicy';
import SharedStory from './pages/SharedStory';
import PublicStory from './pages/PublicStory';
import NotFound from './pages/NotFound';
import TestConnection from "./pages/TestConnection";
import DiagnosticConnection from "./pages/DiagnosticConnection";

import CreateStoryTitles from "./pages/CreateStoryTitles";
import CreateStoryStep1 from "./pages/CreateStoryStep1";
import CreateStoryStep2 from "./pages/CreateStoryStep2";
import CreateStoryStep3 from "./pages/CreateStoryStep3";
import Library from "./pages/Library";
import StoryReaderPage from "./pages/StoryReaderPage";
import Shell from "./components/Shell";
import PromptAdmin from './pages/admin/PromptAdmin';
import AdminGuard from './components/admin/AdminGuard';
import Pricing from './pages/Pricing';
import Subscription from './pages/Subscription';
import { Toaster } from "@/components/ui/toaster";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { PWAUpdateNotification } from "@/components/PWAUpdateNotification";
import { PWANotificationPrompt } from "@/components/PWANotificationPrompt";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ErrorListener } from "@/components/ErrorListener";
import ErrorBoundary from "@/components/ErrorBoundary";
import { usePreloadRoutes } from "@/hooks/usePreloadRoutes";
import { ContactPage } from "@/pages/support/ContactPage";
import { DocumentationPage } from "@/pages/support/DocumentationPage";
import { ServiceStatusPage } from "@/pages/support/ServiceStatusPage";
import { AboutPage } from "@/pages/AboutPage";
function App() {
  // Commented out for testing - usePreloadRoutes();
  
  return (
    <ErrorBoundary>
      <Router>
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
          <Route path="create-story/step-3" element={<CreateStoryStep3 />} />
          <Route path="pricing" element={<Pricing />} />
          <Route path="subscription" element={<Subscription />} />
          <Route path="test-connection" element={<TestConnection />} />
          <Route path="diagnostic-connection" element={<DiagnosticConnection />} />
          <Route path="admin/prompts" element={<AdminGuard><PromptAdmin /></AdminGuard>} />
        </Route>

        {/* Route de fallback */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <ErrorListener />
      <Toaster />
      <PWAInstallPrompt />
      <PWAUpdateNotification />
      <PWANotificationPrompt />
      <OfflineIndicator />
    </Router>
    </ErrorBoundary>
  );
}

export default App;
