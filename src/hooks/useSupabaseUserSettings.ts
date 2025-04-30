
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import type { UserSettings } from '@/types/user-settings';

export const useSupabaseUserSettings = () => {
  const [userSettings, setUserSettings] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    email: '',
    language: 'fr',
    timezone: 'Europe/Paris',
    notifications: {
      email: true,
      inApp: true,
      stories: true,
      system: true,
    },
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { user } = useSupabaseAuth();
  const { toast } = useToast();

  // Charger les paramètres utilisateur depuis Supabase
  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setUserSettings({
            firstName: data.firstname || '',
            lastName: data.lastname || '',
            email: data.email || '',
            language: (data.language as 'fr' | 'en') || 'fr',
            timezone: data.timezone || 'Europe/Paris',
            notifications: {
              email: data.email_notifications ?? true,
              inApp: data.inapp_notifications ?? true,
              stories: data.story_notifications ?? true,
              system: data.system_notifications ?? true,
            },
          });
        }
      } catch (err) {
        console.error('Erreur lors du chargement des paramètres:', err);
        setError(err instanceof Error ? err : new Error('Erreur inconnue'));
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [user]);

  // Mettre à jour les paramètres utilisateur
  const updateUserSettings = useCallback(
    async (updates: Partial<UserSettings>): Promise<void> => {
      if (!user) return;

      try {
        const updateData: Record<string, any> = {};

        // Mappage des champs de UserSettings vers la structure de la base de données
        if (updates.firstName !== undefined) updateData.firstname = updates.firstName;
        if (updates.lastName !== undefined) updateData.lastname = updates.lastName;
        if (updates.language !== undefined) updateData.language = updates.language;
        if (updates.timezone !== undefined) updateData.timezone = updates.timezone;

        // Mappage des notifications
        if (updates.notifications?.email !== undefined)
          updateData.email_notifications = updates.notifications.email;
        if (updates.notifications?.inApp !== undefined)
          updateData.inapp_notifications = updates.notifications.inApp;
        if (updates.notifications?.stories !== undefined)
          updateData.story_notifications = updates.notifications.stories;
        if (updates.notifications?.system !== undefined)
          updateData.system_notifications = updates.notifications.system;

        // Si aucun champ à mettre à jour, ne rien faire
        if (Object.keys(updateData).length === 0) return;

        const { error } = await supabase
          .from('users')
          .update(updateData)
          .eq('id', user.id);

        if (error) throw error;

        // Mettre à jour l'état local avec les nouvelles valeurs
        setUserSettings((prev) => ({
          ...prev,
          ...updates,
        }));

        toast({
          title: 'Paramètres mis à jour',
          description: 'Vos paramètres ont été enregistrés avec succès.',
        });
      } catch (err) {
        console.error('Erreur lors de la mise à jour des paramètres:', err);

        toast({
          title: 'Erreur',
          description:
            'Impossible de mettre à jour vos paramètres. Veuillez réessayer.',
          variant: 'destructive',
        });

        throw err;
      }
    },
    [user, toast]
  );

  // Mettre à jour le mot de passe utilisateur
  const updateUserPassword = useCallback(
    async ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }): Promise<void> => {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;

        toast({
          title: 'Mot de passe mis à jour',
          description: 'Votre mot de passe a été modifié avec succès.',
        });
      } catch (err) {
        console.error('Erreur lors de la mise à jour du mot de passe:', err);

        toast({
          title: 'Erreur',
          description:
            'Impossible de mettre à jour votre mot de passe. Veuillez réessayer.',
          variant: 'destructive',
        });

        throw err;
      }
    },
    [toast]
  );

  return {
    userSettings,
    isLoading,
    error,
    updateUserSettings,
    updateUserPassword,
  };
};
