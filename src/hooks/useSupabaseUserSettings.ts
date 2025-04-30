
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserSettings, SecuritySettings } from '@/types/user-settings';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useSupabaseUserSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    language: 'fr',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notifications: {
      email: true,
      inApp: true,
      stories: true,
      system: true,
    },
  });
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!user) {
        console.log('Aucun utilisateur connecté');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Chargement des paramètres pour:', user.id);
        
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = Not found
          throw error;
        }
        
        if (data) {
          console.log('Document utilisateur trouvé:', data);
          
          // Transformer les données pour correspondre à UserSettings
          const settings: UserSettings = {
            firstName: data.firstname || '',
            lastName: data.lastname || '',
            language: data.language || 'fr',
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: {
              email: data.email_notifications !== false,
              inApp: data.inapp_notifications !== false,
              stories: data.story_notifications !== false,
              system: data.system_notifications !== false,
            },
          };
          
          setUserSettings(settings);
        } else {
          console.log('Aucun document utilisateur trouvé, utilisation des valeurs par défaut');
          
          // Créer un document pour l'utilisateur avec les valeurs par défaut
          const userData = {
            id: user.id,
            email: user.email,
            firstname: '',
            lastname: '',
            language: 'fr',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            email_notifications: true,
            inapp_notifications: true,
            story_notifications: true,
            system_notifications: true,
          };
          
          await supabase.from('users').upsert([userData]);
        }
      } catch (err: any) {
        console.error('Erreur lors du chargement des paramètres:', err);
        toast({
          title: "Erreur",
          description: "Impossible de charger vos paramètres",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadUserSettings();
  }, [user, toast]);

  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    if (!user) {
      console.error('Tentative de mise à jour sans utilisateur connecté');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Mise à jour des paramètres pour:', user.id);
      console.log('Nouvelles valeurs:', newSettings);
      
      // Transformer les données pour correspondre au schéma Supabase
      const supabaseData: Record<string, any> = {};
      
      if (newSettings.firstName !== undefined) supabaseData.firstname = newSettings.firstName;
      if (newSettings.lastName !== undefined) supabaseData.lastname = newSettings.lastName;
      if (newSettings.language !== undefined) supabaseData.language = newSettings.language;
      if (newSettings.timezone !== undefined) supabaseData.timezone = newSettings.timezone;
      
      if (newSettings.notifications) {
        if (newSettings.notifications.email !== undefined) supabaseData.email_notifications = newSettings.notifications.email;
        if (newSettings.notifications.inApp !== undefined) supabaseData.inapp_notifications = newSettings.notifications.inApp;
        if (newSettings.notifications.stories !== undefined) supabaseData.story_notifications = newSettings.notifications.stories;
        if (newSettings.notifications.system !== undefined) supabaseData.system_notifications = newSettings.notifications.system;
      }
      
      const { error } = await supabase
        .from('users')
        .update(supabaseData)
        .eq('id', user.id);
        
      if (error) throw error;
      
      setUserSettings(prev => ({ ...prev, ...newSettings }));
      console.log('Paramètres mis à jour avec succès');
      
      toast({
        title: "Succès",
        description: "Vos paramètres ont été mis à jour",
      });
    } catch (error: any) {
      console.error('Erreur détaillée lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour vos paramètres",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPassword = async ({ currentPassword, newPassword }: SecuritySettings) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      
      toast({
        title: "Succès",
        description: "Votre mot de passe a été mis à jour",
      });
    } catch (error: any) {
      console.error('Erreur lors du changement de mot de passe:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour votre mot de passe",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
  };
};

export default useSupabaseUserSettings;
