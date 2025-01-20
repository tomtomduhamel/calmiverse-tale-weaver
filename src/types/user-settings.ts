export interface UserSettings {
  firstName: string;
  lastName: string;
  language: 'fr' | 'en';
  timezone: string;
  notifications: {
    email: boolean;
    inApp: boolean;
    stories: boolean;
    system: boolean;
  };
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}