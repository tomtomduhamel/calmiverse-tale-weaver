
import React, { useEffect, useState } from 'react';
import { SettingsIcon, AlertCircle } from 'lucide-react';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { AccountInfoSection } from '@/components/settings/AccountInfoSection';
import { KindleSection } from '@/components/settings/KindleSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { SecuritySection } from '@/components/settings/SecuritySection';
import { AccountManagementSection } from '@/components/settings/AccountManagementSection';
import { ReadingPreferencesSection } from '@/components/settings/ReadingPreferencesSection';
import { ThemeSection } from '@/components/settings/ThemeSection';
import { AdminLinksSection } from '@/components/settings/AdminLinksSection';
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { UserSettings, SecuritySettings } from '@/types/user-settings';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const Settings = () => {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
  } = useUserSettings();

  const handleProfileSubmit = async (data: Partial<UserSettings>): Promise<void> => {
    setFormError(null);
    try {
      setIsSubmitting(true);
      console.log('Soumission du profil avec données:', data);
      await updateUserSettings(data);
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      setFormError(error instanceof Error ? error.message : "Impossible de mettre à jour votre profil");
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour votre profil",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationChange = async (key: keyof UserSettings['notifications'], value: boolean): Promise<void> => {
    setFormError(null);
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
      setFormError("Impossible de mettre à jour vos préférences de notifications");
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos préférences de notifications",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReadingPreferenceChange = async (key: keyof UserSettings['readingPreferences'], value: any): Promise<void> => {
    setFormError(null);
    try {
      setIsSubmitting(true);
      await updateUserSettings({
        readingPreferences: {
          ...userSettings.readingPreferences,
          [key]: value,
        },
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour des préférences de lecture:", error);
      setFormError("Impossible de mettre à jour vos préférences de lecture");
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos préférences de lecture",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSecuritySubmit = async (data: SecuritySettings): Promise<void> => {
    setFormError(null);
    try {
      setIsSubmitting(true);
      await updateUserPassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du mot de passe:", error);
      setFormError("Impossible de mettre à jour votre mot de passe");
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur d'authentification</AlertTitle>
          <AlertDescription>
            Vous devez être connecté pour accéder à vos paramètres.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Déterminer si utilisateur est connecté avec mot de passe (pour afficher l'option de changement de mot de passe)
  const showPasswordChange = user.app_metadata?.provider === 'email';

  return (
    <div className="w-full max-w-4xl mx-auto px-4 md:px-8 py-6 space-y-6 md:space-y-8 pb-24">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 md:mb-8 flex items-center gap-2">
        <SettingsIcon className="h-6 w-6 md:h-8 md:w-8" />
        Paramètres utilisateur
      </h1>

      {formError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erreur</AlertTitle>
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <ProfileSection
        userSettings={userSettings}
        onSubmit={handleProfileSubmit}
      />

      <AccountInfoSection user={user} />

      <ThemeSection />

      <ReadingPreferencesSection
        userSettings={userSettings}
        isLoading={isSubmitting}
        onUpdateSettings={updateUserSettings}
      />

      <KindleSection />

      <NotificationsSection
        notifications={userSettings.notifications}
        onNotificationChange={handleNotificationChange}
      />

      <SecuritySection
        onSubmit={handleSecuritySubmit}
        showPasswordChange={showPasswordChange}
      />

      <AdminLinksSection />

      <AccountManagementSection />
    </div>
  );
};

export default Settings;
