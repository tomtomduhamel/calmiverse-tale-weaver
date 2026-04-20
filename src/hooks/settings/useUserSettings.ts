
import { useUserSettingsContext } from '@/contexts/UserSettingsContext';
import type { UseUserSettingsReturn } from './types';

/**
 * Hook d'accès aux paramètres utilisateur.
 * Délègue au UserSettingsContext (singleton global) pour garantir
 * que tous les composants partagent le même état en temps réel.
 */
export const useUserSettings = (): UseUserSettingsReturn => {
  return useUserSettingsContext();
};
