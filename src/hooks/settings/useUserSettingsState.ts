
import { useState, useEffect } from 'react';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserSettings } from '@/types/user-settings';

export const useUserSettingsState = () => {
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
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Erreur lors du chargement des paramètres:', error);
          throw error;
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

  return {
    userSettings,
    setUserSettings,
    isLoading,
    setIsLoading
  };
};
