import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MilkyWayBackgroundProps {
  children: ReactNode;
  className?: string;
}

export const MilkyWayBackground: React.FC<MilkyWayBackgroundProps> = ({ children, className }) => {
  return (
    <div className={cn(
      "relative w-full h-full min-h-[85vh] overflow-hidden rounded-2xl transition-colors duration-500",
      "bg-gradient-to-br from-[#f0f9ff] via-[#e0f2fe] to-[#dbeafe] dark:from-[#030712] dark:to-[#0f172a]",
      "text-foreground", 
      className
    )}>
      {/* Dynamic Cosmic Elements */}
      <div className="absolute inset-0 z-0">
        {/* Stars - more subtle in light mode, brilliant in dark */}
        <div className="absolute top-[10%] left-[20%] w-0.5 h-0.5 bg-primary/40 dark:bg-white rounded-full animate-pulse-slow"></div>
        <div className="absolute top-[25%] left-[60%] w-[3px] h-[3px] bg-primary/30 dark:bg-white rounded-full animate-pulse-slow delay-75 dark:shadow-[0_0_8px_white]"></div>
        <div className="absolute top-[60%] left-[15%] w-1 h-1 bg-amber-400/40 dark:bg-yellow-200 rounded-full animate-pulse-slow delay-150 shadow-[0_0_5px_rgba(251,191,36,0.3)] dark:shadow-[0_0_5px_rgba(254,240,138,0.5)]"></div>
        <div className="absolute top-[80%] left-[75%] w-1.5 h-1.5 bg-blue-400/30 dark:bg-blue-200 rounded-full animate-pulse-slow delay-300 dark:shadow-[0_0_8px_rgba(191,219,254,0.5)]"></div>
        <div className="absolute top-[40%] left-[80%] w-0.5 h-0.5 bg-primary/20 dark:bg-white rounded-full animate-pulse-slow delay-500"></div>
        
        {/* Adaptive Nebulas/Glows */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(56,189,248,0.1),transparent_50%)] dark:bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.15),transparent_50%)]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(147,51,234,0.05),transparent_40%)] dark:bg-[radial-gradient(circle_at_70%_20%,rgba(168,85,247,0.1),transparent_40%)]"></div>
      </div>
      
      {/* Content wrapper */}
      <div className="relative z-10 p-4 md:p-8 flex flex-col h-full">
        {children}
      </div>
    </div>
  );
};
