
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './navigation/Navigation';
import { SidebarProvider } from './ui/sidebar';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full">
        <Navigation />
        <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-8">
          {children || <Outlet />}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Shell;
