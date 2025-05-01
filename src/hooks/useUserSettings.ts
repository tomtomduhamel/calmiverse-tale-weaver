
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserSettings, SecuritySettings } from '@/types/user-settings';
import { useToast } from '@/hooks/use-toast';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';

export const useUserSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userSettings, setUserSettings] = useState<UserSettings>({
    firstName: '',
    lastName: '',
    email: '',
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
        
        // Charger les paramètres utilisateur depuis Supabase
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (error) {
          // Si l'erreur est "No rows found", ce n'est pas une erreur fatale
          if (error.code === 'PGRST116') {
            console.log('Aucun profil trouvé, utilisation des paramètres par défaut');
            // Nous continuerons avec les valeurs par défaut et les sauvegarderons plus tard
          } else {
            throw error;
          }
        }
        
        if (data) {
          console.log('Document utilisateur trouvé:', data);
          
          setUserSettings({
            firstName: data.firstname || '',
            lastName: data.lastname || '',
            email: data.email || user.email || '',
            language: (data.language as 'fr' | 'en') || 'fr',
            timezone: data.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
            notifications: {
              email: data.email_notifications ?? true,
              inApp: data.inapp_notifications ?? true,
              stories: data.story_notifications ?? true,
              system: data.system_notifications ?? true,
            },
          });
        } else {
          console.log('Aucun document utilisateur trouvé, utilisation des valeurs par défaut');
          
          // S'assurer que l'email est défini si l'utilisateur est connecté
          setUserSettings(prev => ({
            ...prev,
            email: user.email || '',
          }));
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
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
  }, [toast, user]);

  const updateUserSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    if (!user) {
      console.error('Tentative de mise à jour sans utilisateur connecté');
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour modifier vos paramètres",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Mise à jour des paramètres pour:', user.id);
      console.log('Nouvelles valeurs:', newSettings);
      
      // Mappage des propriétés UserSettings vers la structure de la table Supabase
      const supabaseData: Record<string, any> = {};
      
      if (newSettings.firstName !== undefined) supabaseData.firstname = newSettings.firstName;
      if (newSettings.lastName !== undefined) supabaseData.lastname = newSettings.lastName;
      if (newSettings.language !== undefined) supabaseData.language = newSettings.language;
      if (newSettings.timezone !== undefined) supabaseData.timezone = newSettings.timezone;
      
      // Mappage des notifications
      if (newSettings.notifications?.email !== undefined) 
        supabaseData.email_notifications = newSettings.notifications.email;
      if (newSettings.notifications?.inApp !== undefined) 
        supabaseData.inapp_notifications = newSettings.notifications.inApp;
      if (newSettings.notifications?.stories !== undefined) 
        supabaseData.story_notifications = newSettings.notifications.stories;
      if (newSettings.notifications?.system !== undefined) 
        supabaseData.system_notifications = newSettings.notifications.system;
      
      // Vérifier si l'utilisateur existe déjà dans la table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('Erreur lors de la vérification du profil:', checkError);
        throw new Error('Impossible de vérifier votre profil');
      }
      
      let error;
      
      if (existingUser) {
        console.log('Mise à jour du profil existant');
        // Mettre à jour l'utilisateur existant
        const result = await supabase
          .from('users')
          .update(supabaseData)
          .eq('id', user.id);
          
        error = result.error;
      } else {
        console.log('Création d\'un nouveau profil');
        // Créer un nouvel utilisateur
        const result = await supabase
          .from('users')
          .insert({
            ...supabaseData,
            id: user.id,
            email: user.email
          });
          
        error = result.error;
      }
      
      if (error) {
        console.error('Erreur lors de la sauvegarde:', error);
        throw new Error('Impossible de sauvegarder vos paramètres');
      }
      
      // Mettre à jour l'état local avec les nouvelles valeurs
      setUserSettings(prev => ({ ...prev, ...newSettings }));
      console.log('Paramètres mis à jour avec succès');
      
      toast({
        title: "Succès",
        description: "Vos paramètres ont été mis à jour",
      });
    } catch (error) {
      console.error('Erreur détaillée lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour vos paramètres",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPassword = async ({ currentPassword, newPassword, confirmPassword }: SecuritySettings): Promise<void> => {
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
    } catch (error) {
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
