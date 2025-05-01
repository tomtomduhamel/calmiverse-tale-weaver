
import React, { useEffect, useState } from 'react';
import { SettingsIcon } from 'lucide-react';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { AccountInfoSection } from '@/components/settings/AccountInfoSection';
import { KindleSection } from '@/components/settings/KindleSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { AccountManagementSection } from '@/components/settings/AccountManagementSection';
import { useUserSettings } from '@/hooks/useUserSettings';
import { useKindleSettings } from '@/hooks/useKindleSettings';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { UserSettings, SecuritySettings } from '@/types/user-settings';

const Settings = () => {
  const { user } = useSupabaseAuth();
  const { settings: kindleSettings } = useKindleSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
  } = useUserSettings();

  const handleProfileSubmit = async (data: Partial<UserSettings>): Promise<void> => {
    try {
      setIsSubmitting(true);
      console.log('Soumission du profil avec données:', data);
      await updateUserSettings(data);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationChange = async (key: keyof UserSettings['notifications'], value: boolean): Promise<void> => {
    try {
      setIsSubmitting(true);
      await updateUserSettings({
        notifications: {
          ...userSettings.notifications,
          [key]: value,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des notifications:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos préférences de notifications",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (data: SecuritySettings): Promise<void> => {
    try {
      setIsSubmitting(true);
      await updateUserPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre mot de passe",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Afficher un message de débogage pour vérifier les données utilisateur
  useEffect(() => {
    if (user && !isLoading) {
      console.log('Données utilisateur chargées:', userSettings);
    }
  }, [user, userSettings, isLoading]);

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
