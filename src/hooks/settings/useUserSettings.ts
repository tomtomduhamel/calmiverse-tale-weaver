
import { useUserSettingsState } from './useUserSettingsState';
import { useUpdateUserSettings } from './useUpdateUserSettings';
import { useUpdateUserPassword } from './useUpdateUserPassword';
import { UseUserSettingsReturn } from './types';

export const useUserSettings = (): UseUserSettingsReturn => {
  const { userSettings, setUserSettings, isLoading, setIsLoading } = useUserSettingsState();
  const { updateUserSettings } = useUpdateUserSettings(setUserSettings, setIsLoading);
  const { updateUserPassword } = useUpdateUserPassword(setIsLoading);

  return {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
  };
};
