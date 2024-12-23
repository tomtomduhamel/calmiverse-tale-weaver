import React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Link } from "react-router-dom";
import type { ViewType } from "@/types/views";

interface AppLayoutProps {
  children: React.ReactNode;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, currentView, onViewChange }) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-serene w-full">
        <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-sm shadow-sm z-50">
          <div className="max-w-7xl mx-auto px-4 h-16 flex justify-between items-center">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/lovable-uploads/08b9555a-5430-4317-9aa0-2652884e8414.png" 
                alt="Calmi Logo" 
                className="h-8 w-auto"
              />
              <span className="text-xl font-semibold text-secondary">Calmi</span>
            </Link>
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