
import React, { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './navigation/Navigation';
import { SidebarProvider } from './ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMenu from './MobileMenu';
import { Footer } from './Footer';
import { useViewManagement } from '@/hooks/useViewManagement';
import { useBackgroundStoryMonitor } from '@/hooks/stories/useBackgroundStoryMonitor';
import { logger } from '@/utils/logger';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { OfflineIndicator } from './OfflineIndicator';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { currentView, setCurrentView } = useViewManagement();
  
  // 🚨 MONITORING ARRIÈRE-PLAN : Surveillar les nouvelles histoires créées
  // Ce hook fonctionne en permanence tant que l'utilisateur est authentifié
  const { isMonitoring } = useBackgroundStoryMonitor();
  
  // Déterminer si le menu mobile doit être affiché
  // Ne pas l'afficher si nous sommes sur la route du lecteur d'histoire
  const showMobileMenu = isMobile && !location.pathname.startsWith('/reader/');
  
  logger.debug("[Shell] Configuration du menu mobile", {
    isMobile,
    pathname: location.pathname,
    showMobileMenu,
    backgroundMonitoring: isMonitoring
  });
  
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full relative">
        {/* Only show top navigation on desktop and not on reader pages */}
        {!isMobile && !location.pathname.startsWith('/reader/') && <Navigation />}
        
        {/* Main content with optimized mobile spacing */}
        <div className={`flex-1 w-full max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 ${showMobileMenu ? 'pb-16' : 'pb-4'}`}>
          {children || <Outlet />}
        </div>
        
        {/* Footer */}
        <Footer />
        
        {/* Indicateurs PWA et synchronisation */}
        <OfflineIndicator />
        <OfflineSyncIndicator />
        
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
