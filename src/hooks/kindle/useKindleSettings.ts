
import { useKindleSettingsState } from './useKindleSettingsState';
import { useUpdateKindleSettings } from './useUpdateKindleSettings';
import { KindleSettings } from './types';

export const useKindleSettings = () => {
  const { settings, setSettings } = useKindleSettingsState();
  const { updateSettings } = useUpdateKindleSettings(settings, setSettings);

  const isConfigured = Boolean(settings.kindleEmail);

  return {
    settings,
    updateSettings,
    isConfigured,
  };
};
