
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
        transition-all duration-300 ease-in-out
        ${isVisible 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-full opacity-0 pointer-events-none'
        }
      `}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className={`
        border-t p-4 backdrop-blur-sm bg-background/95
      `}>
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
      
      {/* Indicateur visuel discret */}
      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-12 h-1 rounded-full bg-muted-foreground/30 transition-opacity duration-200" />
    </div>
  );
};
