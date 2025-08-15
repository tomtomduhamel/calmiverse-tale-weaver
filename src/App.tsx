
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
import CreateStoryN8n from "./pages/CreateStoryN8n";
import CreateStoryTitles from "./pages/CreateStoryTitles";
import CreateStoryStep1 from "./pages/CreateStoryStep1";
import CreateStoryStep2 from "./pages/CreateStoryStep2";
import CreateStoryStep3 from "./pages/CreateStoryStep3";
import Library from "./pages/Library";
import StoryReaderPage from "./pages/StoryReaderPage";
import Shell from "./components/Shell";
import PromptAdmin from './pages/admin/PromptAdmin';
import AdminGuard from './components/admin/AdminGuard';
import { Toaster } from "@/components/ui/toaster"
function App() {
  return (
    <Router>
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
          <Route path="library" element={<Library />} />
          <Route path="reader/:id" element={<StoryReaderPage />} />
          <Route path="create-story-simple" element={<MinimalStoryPage />} />
          <Route path="create-story-n8n" element={<CreateStoryN8n />} />
          <Route path="create-story-titles" element={<CreateStoryTitles />} />
          <Route path="create-story/step-1" element={<CreateStoryStep1 />} />
          <Route path="create-story/step-2" element={<CreateStoryStep2 />} />
          <Route path="create-story/step-3" element={<CreateStoryStep3 />} />
          <Route path="test-connection" element={<TestConnection />} />
          <Route path="diagnostic-connection" element={<DiagnosticConnection />} />
          <Route path="admin/prompts" element={<AdminGuard><PromptAdmin /></AdminGuard>} />
        </Route>

        {/* Route de fallback */}
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
