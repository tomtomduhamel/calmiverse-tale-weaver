import React from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { usePWA } from '@/hooks/usePWA';

export const OfflineIndicator: React.FC = () => {
  const { isOnline } = usePWA();

  return (
    <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
      isOnline ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <div className="flex items-center gap-2 bg-muted/90 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1.5 text-xs font-medium shadow-soft">
        <WifiOff className="h-3 w-3 text-muted-foreground" />
        <span className="text-muted-foreground">Mode hors ligne</span>
      </div>
    </div>
  );
};