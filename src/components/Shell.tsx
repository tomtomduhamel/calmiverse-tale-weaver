
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './navigation/Navigation';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-8">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default Shell;
