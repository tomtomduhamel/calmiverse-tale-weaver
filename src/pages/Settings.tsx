import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useKindleSettings } from '@/hooks/useKindleSettings';
import { SettingsIcon } from 'lucide-react';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { AccountInfoSection } from '@/components/settings/AccountInfoSection';
import { KindleSection } from '@/components/settings/KindleSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { AccountManagementSection } from '@/components/settings/AccountManagementSection';
import { UserSettings } from '@/types/user-settings'; // Ajout de l'import manquant

const Settings = () => {
  const { user } = useAuth();
  const { settings: kindleSettings } = useKindleSettings();
  const {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
  } = useUserSettings();

  const handleNotificationChange = async (key: keyof UserSettings['notifications'], value: boolean) => {
    await updateUserSettings({
      notifications: {
        ...userSettings.notifications,
        [key]: value,
      },
    });
  };

  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <SettingsIcon className="h-8 w-8" />
        Paramètres utilisateur
      </h1>

      <ProfileSection 
        userSettings={userSettings}
        onSubmit={updateUserSettings}
      />

      <AccountInfoSection user={user} />

      <KindleSection kindleEmail={kindleSettings.kindleEmail} />

      <NotificationsSection 
        notifications={userSettings.notifications}
        onNotificationChange={handleNotificationChange}
      />

      <SecuritySection 
        onSubmit={updateUserPassword}
        showPasswordChange={user.providerData[0]?.providerId === 'password'}
      />

      <AccountManagementSection 
        onDeleteAccount={async () => {
          // Implement account deletion logic here
          console.log('Delete account');
        }}
      />
    </div>
  );
};

export default Settings;