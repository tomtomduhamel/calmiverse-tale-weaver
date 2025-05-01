
import React, { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from './navigation/Navigation';

interface ShellProps {
  children?: ReactNode;
}

export const Shell: React.FC<ShellProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <div className="flex-1">
        {children || <Outlet />}
      </div>
    </div>
  );
};

export default Shell;
