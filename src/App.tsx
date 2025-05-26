
import React from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Auth from './pages/Auth';
import Index from './pages/Index';
import ChildrenListPage from './pages/ChildrenListPage';
import KidsProfile from './pages/KidsProfile';
import Settings from './pages/Settings';
import MinimalStoryPage from './pages/MinimalStoryPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SharedStory from './pages/SharedStory';
import PublicStory from './pages/PublicStory';
import NotFound from './pages/NotFound';
import TestConnection from "./pages/TestConnection";
import DiagnosticConnection from "./pages/DiagnosticConnection";
import Shell from "./components/Shell";
import { Toaster } from "@/components/ui/toaster"
import { SupabaseAuthProvider } from './contexts/SupabaseAuthContext';
import CreateStoryN8n from "./pages/CreateStoryN8n";

function App() {
  return (
    <SupabaseAuthProvider>
      <Routes>
        {/* Routes publiques */}
        <Route path="/auth" element={<Auth />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/shared/:token" element={<SharedStory />} />
        <Route path="/story/:id" element={<PublicStory />} />
        <Route path="/404" element={<NotFound />} />

        {/* Routes avec authentification */}
        <Route path="/" element={<Shell />}>
          <Route index element={<Index />} />
          <Route path="children" element={<ChildrenListPage />} />
          <Route path="kids-profile" element={<KidsProfile />} />
          <Route path="settings" element={<Settings />} />
          <Route path="create-story-simple" element={<MinimalStoryPage />} />
          <Route path="create-story-n8n" element={<CreateStoryN8n />} />
          <Route path="test-connection" element={<TestConnection />} />
          <Route path="diagnostic-connection" element={<DiagnosticConnection />} />
        </Route>

        {/* Route de fallback */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Toaster />
    </SupabaseAuthProvider>
  );
}

export default App;
