import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

const AppContent = () => {
  const navigate = useNavigate();

  const handleHomeClick = () => {
    // Utilisation de replace pour éviter l'accumulation dans l'historique
    navigate("/", { replace: true });
  };

  return (
    <main className="relative min-h-screen w-full bg-gradient-night dark:bg-gray-900 transition-colors duration-300">
      {/* Header avec z-index élevé pour être au-dessus du contenu */}
      <header className="fixed top-0 left-0 right-0 bg-[#D6EAF8]/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-sm z-[9999]">
        <nav className="max-w-7xl mx-auto px-4 h-16">
          <div className="h-full flex justify-center items-center">
            <button
              onClick={handleHomeClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-2"
              aria-label="Retour à l'accueil"
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
          </div>
        </nav>
      </header>

      {/* Contenu principal avec padding-top pour éviter le chevauchement avec le header */}
      <div className="relative max-w-7xl mx-auto p-6 pt-24">
        <Routes>
          <Route path="/" element={<Index />} />
        </Routes>
      </div>
    </main>
  );
};

const App = () => (
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  </BrowserRouter>
);

export default App;