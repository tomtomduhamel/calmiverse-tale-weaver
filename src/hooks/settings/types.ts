
import { UserSettings, SecuritySettings } from '@/types/user-settings';

export interface UserSettingsState {
  firstName: string;
  lastName: string;
  email: string;
  language: 'fr' | 'en';
  timezone: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    stories: boolean;
    system: boolean;
  };
}

export interface UseUserSettingsReturn {
  userSettings: UserSettings;
  isLoading: boolean;
  updateUserSettings: (newSettings: Partial<UserSettings>) => Promise<void>;
  updateUserPassword: (settings: SecuritySettings) => Promise<void>;
}
