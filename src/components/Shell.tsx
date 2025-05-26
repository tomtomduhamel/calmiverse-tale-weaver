
import React, { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './navigation/Navigation';
import { SidebarProvider } from './ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMenu from './MobileMenu';
import { useViewManagement } from '@/hooks/useViewManagement';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { currentView, setCurrentView } = useViewManagement();
  
  // Déterminer si le menu mobile doit être affiché
  // Ne pas l'afficher si nous sommes sur la route du lecteur d'histoire
  const showMobileMenu = isMobile && !location.pathname.startsWith('/reader/');
  
  console.log("[Shell] DEBUG: Configuration du menu mobile", {
    isMobile,
    pathname: location.pathname,
    showMobileMenu
  });
  
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full">
        {/* Only show top navigation on desktop and not on reader pages */}
        {!isMobile && !location.pathname.startsWith('/reader/') && <Navigation />}
        
        {/* Adjust padding to avoid content being hidden under bottom nav */}
        <div className={`flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 ${showMobileMenu ? 'pb-20' : 'pb-8'}`}>
          {children || <Outlet />}
        </div>
        
        {/* Afficher le menu mobile uniquement si nous ne sommes pas dans le lecteur */}
        {showMobileMenu && (
          <MobileMenu 
            currentView={currentView} 
            onViewChange={setCurrentView} 
          />
        )}
      </div>
    </SidebarProvider>
  );
};

export default Shell;
