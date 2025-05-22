
export interface UserSettings {
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
  readingPreferences: {
    autoScrollEnabled: boolean;
    readingSpeed: number; // mots par minute
    backgroundMusicEnabled: boolean;
  };
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
