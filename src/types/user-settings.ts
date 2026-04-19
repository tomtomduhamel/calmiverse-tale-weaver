
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
    readingSpeed: number; // mots par minute (vitesse sélectionnée)
    backgroundMusicEnabled: boolean;
    playVideoIntro: boolean;
    customSpeedSlow: number; // vitesse personnalisée Escargot (50-200)
    customSpeedNormal: number; // vitesse personnalisée Tortue (50-200)
    customSpeedFast: number; // vitesse personnalisée Lapin (50-200)
    immersiveReadingMode: 'none' | 'pulse' | 'karaoke' | 'brush'; // Mode de lecture immersive
  };
}

export interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}
