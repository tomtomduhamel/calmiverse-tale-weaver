import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';

/**
 * 🛡️ SAFE THEME PROVIDER
 * Wrapper pour ThemeProvider qui attend que React soit complètement prêt
 * Résout la race condition "Cannot read properties of undefined (reading 'useLayoutEffect')"
 */
export const SafeThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReactReady, setIsReactReady] = useState(false);

  useEffect(() => {
    // React est prêt si useEffect s'exécute
    console.log('✅ [SafeThemeProvider] React est prêt, activation du ThemeProvider');
    setIsReactReady(true);
  }, []);

  if (!isReactReady) {
    // Pas de ThemeProvider tant que React n'est pas prêt
    // Rendu direct des enfants sans thème (fallback système)
    console.log('⏳ [SafeThemeProvider] En attente de React...');
    return <>{children}</>;
  }

  return (
    <ThemeProvider 
      attribute="class" 
      defaultTheme="system" 
      enableSystem={true}
      storageKey="calmi-theme"
    >
      {children}
    </ThemeProvider>
  );
};
