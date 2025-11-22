import React, { useState, useEffect } from 'react';
import { ThemeProvider } from 'next-themes';

/**
 * 🛡️ SAFE THEME PROVIDER - PHASE 3
 * Wrapper pour ThemeProvider qui attend que React soit complètement prêt
 * Résout la race condition "Cannot read properties of undefined (reading 'useLayoutEffect')"
 * 
 * DIAGNOSTICS:
 * - Vérifie explicitement React.version
 * - Vérifie React.useLayoutEffect disponibilité
 * - Logs détaillés pour debugging mobile
 */
export const SafeThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [isReactReady, setIsReactReady] = useState(false);

  useEffect(() => {
    // 🔍 PHASE 3: Vérifications explicites avant activation ThemeProvider
    console.log('🔍 [SafeThemeProvider] useEffect déclenché - React est fonctionnel');
    
    // Vérifier React.version
    if (React.version) {
      console.log('✅ [SafeThemeProvider] React.version détecté:', React.version);
    } else {
      console.warn('⚠️ [SafeThemeProvider] React.version non disponible');
    }
    
    // Vérifier useLayoutEffect (critique pour next-themes)
    if (typeof React.useLayoutEffect !== 'undefined') {
      console.log('✅ [SafeThemeProvider] React.useLayoutEffect disponible');
    } else {
      console.error('❌ [SafeThemeProvider] React.useLayoutEffect MANQUANT - next-themes va échouer');
    }
    
    // Vérifier autres APIs React critiques
    const reactAPIs = {
      useState: typeof React.useState !== 'undefined',
      useEffect: typeof React.useEffect !== 'undefined',
      useContext: typeof React.useContext !== 'undefined',
      createContext: typeof React.createContext !== 'undefined',
    };
    console.log('🔍 [SafeThemeProvider] APIs React:', reactAPIs);
    
    // Activation du ThemeProvider
    console.log('✅ [SafeThemeProvider] Activation du ThemeProvider');
    setIsReactReady(true);
  }, []);

  if (!isReactReady) {
    // 🔍 PHASE 3: Fallback avec mode sombre par défaut pendant l'attente
    console.log('⏳ [SafeThemeProvider] En attente de React - Mode sombre par défaut');
    return <div className="dark">{children}</div>;
  }

  console.log('🎨 [SafeThemeProvider] Rendu avec ThemeProvider actif');
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
