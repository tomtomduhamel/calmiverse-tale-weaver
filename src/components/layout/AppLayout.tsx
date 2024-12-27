import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link, useNavigate } from "react-router-dom";
import type { ViewType } from "@/types/views";

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentView, onViewChange }) => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    onViewChange("home");
    navigate("/");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-night w-full">
        <header className="fixed top-0 left-0 right-0 bg-[#D6EAF8]/80 backdrop-blur-sm shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-center items-center">
            <div 
              onClick={handleLogoClick}
              className="flex items-center gap-2 cursor-pointer"
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

        <div className="flex w-full">
          <AppSidebar 
            currentView={currentView} 
            onViewChange={onViewChange}
          />
          <main className="flex-1 max-w-7xl mx-auto p-6 pt-24">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AppLayout;