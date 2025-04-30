
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Settings, LogOut } from "lucide-react";
import { useSupabaseAuth } from "@/contexts/SupabaseAuthContext";
import Index from "./pages/Index";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SettingsPage from "./pages/Settings";
import SharedStory from "./pages/SharedStory";
import LoginForm from "./components/auth/LoginForm";

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useSupabaseAuth();

  console.log("App rendering with pathname:", location.pathname);
  console.log("User authenticated:", !!user);

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Navigation vers l'accueil");
    
    if (location.pathname === "/") {
      window.location.reload();
      return;
    }
    
    navigate("/");
  };

  const handlePrivacyClick = () => {
    navigate("/privacy");
  };

  const handleSettingsClick = () => {
    navigate("/settings");
  };

  // Si l'utilisateur n'est pas connecté et n'est pas sur la page de partage, afficher le formulaire de connexion
  if (!user && !location.pathname.startsWith('/shared')) {
    console.log("Showing login form");
    return (
      <main className="min-h-screen w-full bg-gradient-night dark:bg-gray-900 flex items-center justify-center p-4">
        <LoginForm />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen w-full bg-gradient-night dark:bg-gray-900 transition-colors duration-300">
      {!location.pathname.startsWith('/shared') && (
        <header className="relative bg-[#D6EAF8] dark:bg-gray-900 shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 h-16">
            <div className="h-full flex justify-between items-center">
              <button
                onClick={handleHomeClick}
                className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-2 cursor-pointer active:scale-95"
                aria-label="Retour à l'accueil"
                type="button"
              >
                <img 
                  src="/lovable-uploads/19ebb6ec-fb66-480b-af41-e09a5e6eaf73.png" 
                  alt="Calmi Logo" 
                  className="h-8 w-auto"
                />
                <img 
                  src="/lovable-uploads/f43b0052-5023-41e6-9ebb-c5e58ec7cbfb.png" 
                  alt="Calmi Text" 
                  className="h-8 w-auto"
                />
              </button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={handleSettingsClick}
                  className="flex items-center gap-2"
                  aria-label="Paramètres"
                >
                  <Settings className="h-5 w-5" />
                  <span className="hidden md:inline">Paramètres</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={handlePrivacyClick}
                  className="flex items-center gap-2"
                  aria-label="Règles de confidentialité"
                >
                  <Shield className="h-5 w-5" />
                  <span className="hidden md:inline">Confidentialité</span>
                </Button>

                <Button
                  variant="ghost"
                  onClick={logout}
                  className="flex items-center gap-2"
                  aria-label="Déconnexion"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="hidden md:inline">Déconnexion</span>
                </Button>
              </div>
            </div>
          </nav>
        </header>
      )}

      <div className="relative max-w-7xl mx-auto p-6">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/shared/*" element={<SharedStory />} />
        </Routes>
      </div>
    </main>
  );
};

const App = () => {
  console.log("App component initializing");
  
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AppContent />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </BrowserRouter>
  );
};

export default App;
