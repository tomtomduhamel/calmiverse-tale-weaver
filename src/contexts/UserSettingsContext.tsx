import React, { createContext, useContext } from 'react';
import { useUserSettingsState } from '@/hooks/settings/useUserSettingsState';
import { useUpdateUserSettings } from '@/hooks/settings/useUpdateUserSettings';
import { useUpdateUserPassword } from '@/hooks/settings/useUpdateUserPassword';
import type { UseUserSettingsReturn } from '@/hooks/settings/types';

// Contexte singleton pour que tous les composants partagent le même état
const UserSettingsContext = createContext<UseUserSettingsReturn | undefined>(undefined);

export const UserSettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userSettings, setUserSettings, isLoading, setIsLoading } = useUserSettingsState();
  const { updateUserSettings } = useUpdateUserSettings(setUserSettings, setIsLoading);
  const { updateUserPassword } = useUpdateUserPassword(setIsLoading);

  const value: UseUserSettingsReturn = {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
  };

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
};

/**
 * Hook pour accéder aux paramètres utilisateur depuis le contexte partagé.
 * DOIT être utilisé à la place de useUserSettings() pour éviter les instances multiples
 * qui ne se synchronisent pas entre elles.
 */
export const useUserSettingsContext = (): UseUserSettingsReturn => {
  const context = useContext(UserSettingsContext);
  if (!context) {
    throw new Error('useUserSettingsContext doit être utilisé dans un UserSettingsProvider');
  }
  return context;
};
