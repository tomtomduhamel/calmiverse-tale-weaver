import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

/**
 * Hook centralisé pour gérer le thème de l'application Calmiverse
 * Enveloppe la logique next-themes avec des fonctionnalités supplémentaires
 */
export const useAppTheme = () => {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Évite les problèmes d'hydratation
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDarkMode = mounted ? resolvedTheme === 'dark' : false;
  const isLightMode = mounted ? resolvedTheme === 'light' : true;

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const setDarkMode = (darkMode: boolean) => {
    setTheme(darkMode ? 'dark' : 'light');
  };

  const setLightMode = () => {
    setTheme('light');
  };

  const setSystemMode = () => {
    setTheme('system');
  };

  return {
    // État actuel
    theme,
    resolvedTheme,
    systemTheme,
    isDarkMode,
    isLightMode,
    mounted,

    // Actions
    setTheme,
    toggleTheme,
    setDarkMode,
    setLightMode,
    setSystemMode,
  };
};

export default useAppTheme;