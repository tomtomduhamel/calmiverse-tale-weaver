
import React, { ReactNode } from 'react';

interface SupabaseProviderProps {
  children: ReactNode;
}

export const SupabaseProvider: React.FC<SupabaseProviderProps> = ({ children }) => {
  return <>{children}</>;
};

export default SupabaseProvider;
