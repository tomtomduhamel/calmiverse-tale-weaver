import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const AppContent = () => {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-gradient-night w-full">
      <header className="fixed top-0 left-0 right-0 bg-[#D6EAF8]/80 backdrop-blur-sm shadow-sm z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex justify-center items-center">
          <div 
            className="flex items-center gap-2 cursor-pointer" 
            onClick={() => navigate("/")}
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
          </div>
        </div>
      </header>
      <div className="max-w-7xl mx-auto p-6 pt-24">
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