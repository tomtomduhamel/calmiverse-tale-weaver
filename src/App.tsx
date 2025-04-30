
import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { SimpleLoader } from '@/components/ui/SimpleLoader';
import { SupabaseAuthProvider } from '@/contexts/SupabaseAuthContext';
import Navigation from '@/components/navigation/Navigation';

// Lazy-loaded pages
const Index = lazy(() => import('@/pages/Index'));
const Auth = lazy(() => import('@/pages/Auth'));
const Settings = lazy(() => import('@/pages/Settings'));
const TestConnection = lazy(() => import('@/pages/TestConnection'));
const PublicStory = lazy(() => import('@/pages/PublicStory'));
const KidsProfile = lazy(() => import('@/pages/KidsProfile'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  return (
    <SupabaseAuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-primary/5 overflow-x-hidden">
          <Navigation />
          <main className="flex-1">
            <Suspense fallback={<SimpleLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/test-connection" element={<TestConnection />} />
                <Route path="/stories/:storyId" element={<PublicStory />} />
                <Route path="/kids-profile/:profileId" element={<KidsProfile />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Toaster />
        </div>
      </Router>
    </SupabaseAuthProvider>
  );
}

export default App;
