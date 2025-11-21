import React from 'react';
import { AlertCircle } from 'lucide-react';

/**
 * 🎭 PREVIEW BANNER
 * Bannière informative en mode preview mobile Lovable
 */
export const PreviewBanner: React.FC = () => {
  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800 sticky top-0 z-50">
      <div className="flex items-center justify-center gap-2 px-4 py-2 text-sm text-yellow-800 dark:text-yellow-200">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="font-medium">Mode Preview - Données de démonstration</span>
      </div>
    </div>
  );
};
