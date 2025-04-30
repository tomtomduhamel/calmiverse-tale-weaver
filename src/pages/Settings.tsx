
import React from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useSupabaseUserSettings } from '@/hooks/useSupabaseUserSettings';
import { useKindleSettings } from '@/hooks/useKindleSettings';
import { SettingsIcon } from 'lucide-react';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { AccountInfoSection } from '@/components/settings/AccountInfoSection';
import { KindleSection } from '@/components/settings/KindleSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { AccountManagementSection } from '@/components/settings/AccountManagementSection';
import type { UserSettings, SecuritySettings } from '@/types/user-settings';

const Settings = () => {
  const { user } = useSupabaseAuth();
  const { settings: kindleSettings } = useKindleSettings();
  const {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
  } = useSupabaseUserSettings();

  const handleProfileSubmit = async (data: Partial<UserSettings>): Promise<void> => {
    try {
      await updateUserSettings(data);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    }
  };

  const handleNotificationChange = async (key: keyof UserSettings['notifications'], value: boolean): Promise<void> => {
    try {
      await updateUserSettings({
        notifications: {
          ...userSettings.notifications,
          [key]: value,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des notifications:", error);
    }
  };

  const handleSecuritySubmit = async (data: SecuritySettings): Promise<void> => {
    try {
      await updateUserPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Déterminer si utilisateur est connecté avec mot de passe (pour afficher l'option de changement de mot de passe)
  const showPasswordChange = user.app_metadata?.provider === 'email';
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <SettingsIcon className="h-8 w-8" />
        Paramètres utilisateur
      </h1>

      <ProfileSection 
        userSettings={userSettings}
        onSubmit={handleProfileSubmit}
      />

      <AccountInfoSection user={user} />

      <KindleSection kindleEmail={kindleSettings.kindleEmail} />

      <NotificationsSection 
        notifications={userSettings.notifications}
        onNotificationChange={handleNotificationChange}
      />

      <SecuritySection 
        onSubmit={handleSecuritySubmit}
        showPasswordChange={showPasswordChange}
      />

      <AccountManagementSection />
    </div>
  );
};

export default Settings;
