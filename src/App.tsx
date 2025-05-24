import React, { Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import Shell from './components/Shell';
import Auth from './pages/Auth';
import Index from './pages/Index';
import NotFound from './pages/NotFound';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TestConnection from './pages/TestConnection';
import Settings from './pages/Settings';
import KidsProfile from './pages/KidsProfile';
import PublicStory from './pages/PublicStory';
import SupabaseProvider from './providers/SupabaseProvider';
import ThemeProvider from './providers/ThemeProvider';
import { useSupabaseAuth } from './contexts/SupabaseAuthContext';
import { checkAuthState } from './integrations/supabase/client';
import SharedStory from './pages/SharedStory';
import MinimalStoryPage from './pages/MinimalStoryPage';
import ChildrenListPage from './pages/ChildrenListPage';
import DiagnosticConnection from './pages/DiagnosticConnection';

function PublicRoute() {
  return <Shell />;
}

function PrivateRoute() {
  const { session, loading } = useSupabaseAuth();
  const location = useLocation();
  const { toast } = useToast();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      if (!session && !loading) {
        toast({
          title: 'Non authentifié',
          description:
            'Vous devez être connecté pour accéder à cette page. Redirection vers la page de connexion...',
        });
      }
      setHasCheckedAuth(true);
    };

    checkAuth();
  }, [session, loading, toast, location]);

  if (loading || !hasCheckedAuth) {
    return <div>Chargement...</div>;
  }

  return session ? (
    <Shell />
  ) : (
    <Navigate to="/login" replace state={{ from: location }} />
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="vite-react-theme">
      <SupabaseProvider>
        <Router>
          <Routes>
            <Route element={<PublicRoute />}>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/test-connection" element={<TestConnection />} />
              <Route path="/shared-story" element={<SharedStory />} />
            </Route>

            <Route element={<PrivateRoute />}>
              <Route path="/app" element={<Index />} />
              <Route path="/children" element={<ChildrenListPage />} />
              <Route path="/profiles/:profileId" element={<KidsProfile />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/story/:storyId" element={<PublicStory />} />
              <Route path="/create-story-simple" element={<MinimalStoryPage />} />
            </Route>
            
            <Route path="*" element={<NotFound />} />
            <Route path="/diagnostic" element={<DiagnosticConnection />} />
          </Routes>
        </Router>
        <Toaster />
      </SupabaseProvider>
    </ThemeProvider>
  );
}

export default App;
