
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './navigation/Navigation';
import { SidebarProvider } from './ui/sidebar';
import { useIsMobile } from '@/hooks/use-mobile';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  const isMobile = useIsMobile();
  
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full">
        {/* Only show top navigation on desktop */}
        {!isMobile && <Navigation />}
        {/* Adjust padding to avoid content being hidden under bottom nav */}
        <div className={`flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 ${isMobile ? 'pb-20' : 'pb-8'}`}>
          {children || <Outlet />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Shell;
