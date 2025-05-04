
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
      <div className="flex flex-col min-h-screen w-full overflow-hidden">
        <Navigation />
        <div className={`flex-1 w-full max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 ${isMobile ? 'pb-24' : 'pb-8'}`}>
          {children || <Outlet />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Shell;
