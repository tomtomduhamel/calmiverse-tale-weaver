import React from 'react';
import { ThemeToggle } from "@/components/ui/theme-toggle";

/**
 * Composant de toggle de thème global pour l'application Calmiverse
 * À utiliser dans les layouts et headers principaux
 */
export const GlobalThemeToggle: React.FC = () => {
  return (
    <div className="flex items-center">
      <ThemeToggle 
        variant="ghost" 
        size="sm"
        showLabels={false}
      />
    </div>
  );
};

export default GlobalThemeToggle;