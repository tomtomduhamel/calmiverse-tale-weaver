
import React from 'react';

interface CollapsibleControlsProps {
  isVisible: boolean;
  isDarkMode?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  children: React.ReactNode;
}

export const CollapsibleControls: React.FC<CollapsibleControlsProps> = ({
  isVisible,
  isDarkMode = false,
  onMouseEnter,
  onMouseLeave,
  children
}) => {
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        transition-all duration-500 ease-calm
        ${isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0 pointer-events-none'
        }
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="border-t border-primary-soft/20 p-4 backdrop-blur-xl bg-background/70 shadow-floating pb-[calc(1rem+env(safe-area-inset-bottom,0px))]">
        <div className="max-w-[640px] mx-auto">
          {children}
        </div>
      </div>
      
      {/* Indicateur visuel discret */}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-10 h-1 rounded-full bg-primary-soft/50 transition-opacity duration-300" />
    </div>
  );
};
