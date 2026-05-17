import React from 'react';
import { SimpleThemeToggle } from "@/components/ui/SimpleThemeToggle";

/**
 * Composant de toggle de thème global pour l'application Calmi
 * À utiliser dans les layouts et headers principaux
 */
export const GlobalThemeToggle: React.FC = () => {
  return (
    <div className="flex items-center">
      <SimpleThemeToggle 
        variant="ghost" 
        size="sm"
      />
    </div>
  );
};

export default GlobalThemeToggle;