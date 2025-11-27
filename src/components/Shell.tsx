
import React, { ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navigation from './navigation/Navigation';
import { SidebarProvider } from './ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileMenu from './MobileMenu';
import { Footer } from './Footer';
import { useBackgroundStoryMonitor } from '@/hooks/stories/useBackgroundStoryMonitor';
import { logger } from '@/utils/logger';
import { OfflineSyncIndicator } from './OfflineSyncIndicator';
import { OfflineIndicator } from './OfflineIndicator';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { AuthGuard } from './auth/AuthGuard';
import { StoryGenerationManager } from '@/services/stories/StoryGenerationManager';
import { useNavigate } from 'react-router-dom';
import { isPreviewMode } from '@/utils/mobileBootOptimizer';
import { PreviewBanner } from './PreviewBanner';
import { FeedbackButton } from './feedback/FeedbackButton';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const previewMode = isPreviewMode();
  
  logger.debug("[Shell] Mode detection:", { previewMode, isMobile });
  
  // 🚨 MONITORING ARRIÈRE-PLAN : Surveillance des nouvelles histoires créées
  // Ce hook fonctionne en permanence tant que l'utilisateur est authentifié
  const { isMonitoring } = useBackgroundStoryMonitor();
  
  // Déterminer si le menu mobile doit être affiché
  // Ne pas l'afficher si nous sommes sur la route du lecteur d'histoire
  const showMobileMenu = isMobile && !location.pathname.startsWith('/reader/');
  const isReaderPage = location.pathname.startsWith('/reader/');
  
  logger.debug("[Shell] Configuration", {
    isMobile,
    pathname: location.pathname,
    showMobileMenu,
    backgroundMonitoring: isMonitoring,
    userAuthenticated: !!user,
    previewMode
  });

  // Écouter les événements de navigation des notifications
  React.useEffect(() => {
    const handleNavigationEvent = (event: CustomEvent<{ path: string }>) => {
      navigate(event.detail.path);
    };
    
    window.addEventListener('calmi-navigate' as any, handleNavigationEvent);
    return () => window.removeEventListener('calmi-navigate' as any, handleNavigationEvent);
  }, [navigate]);

  // 🎭 MODE PREVIEW : Bypass complet de l'AuthGuard pour éviter l'écran blanc
  // 🔐 MODE STANDARD : AuthGuard normal avec redirection
  logger.debug(`[Shell] Mode ${previewMode ? '🎭 Preview - Bypass AuthGuard' : '🔐 Standard avec AuthGuard'}`);
  
  if (previewMode) {
    // Mode preview : affichage direct sans AuthGuard
    return (
      <SidebarProvider>
        <div className="flex flex-col min-h-screen w-full relative">
          <PreviewBanner />
          
          {/* Only show top navigation on desktop and not on reader pages */}
          {!isMobile && !location.pathname.startsWith('/reader/') && <Navigation />}
          
          {/* Main content with optimized mobile spacing */}
          <div className={`flex-1 w-full max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 ${showMobileMenu ? 'pb-16' : 'pb-4'}`}>
            <StoryGenerationManager>
              {children || <Outlet />}
            </StoryGenerationManager>
          </div>
          
          {/* Footer */}
          <Footer />
          
          {/* Indicateurs PWA et synchronisation */}
          <OfflineIndicator />
          <OfflineSyncIndicator />
          
          {/* Bouton de feedback (masqué sur le lecteur) */}
          {!isReaderPage && <FeedbackButton />}
          
          {/* Afficher le menu mobile uniquement si nous ne sommes pas dans le lecteur */}
          {showMobileMenu && <MobileMenu />}
        </div>
      </SidebarProvider>
    );
  }
  
  // Mode standard : avec AuthGuard
  return (
    <AuthGuard>
      <SidebarProvider>
        <div className="flex flex-col min-h-screen w-full relative">
          {/* Only show top navigation on desktop and not on reader pages */}
          {!isMobile && !location.pathname.startsWith('/reader/') && <Navigation />}
          
          {/* Main content with optimized mobile spacing */}
          <div className={`flex-1 w-full max-w-7xl mx-auto px-1 sm:px-6 lg:px-8 ${showMobileMenu ? 'pb-16' : 'pb-4'}`}>
            <StoryGenerationManager>
              {children || <Outlet />}
            </StoryGenerationManager>
          </div>
          
          {/* Footer */}
          <Footer />
          
          {/* Indicateurs PWA et synchronisation */}
          <OfflineIndicator />
          <OfflineSyncIndicator />
          
          {/* Bouton de feedback (masqué sur le lecteur) */}
          {!isReaderPage && <FeedbackButton />}
          
          {/* Afficher le menu mobile uniquement si nous ne sommes pas dans le lecteur */}
          {showMobileMenu && <MobileMenu />}
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
};

export default Shell;
