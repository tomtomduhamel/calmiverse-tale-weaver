
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { KindleSettings } from './types';

export const useKindleSettingsState = () => {
  const { user } = useSupabaseAuth();
  const [settings, setSettings] = useState<KindleSettings>({
    firstName: '',
    lastName: '',
    kindleEmail: '',
  });
  const [isLoading, setIsLoading] = useState(true);

  // Charger les paramètres depuis Supabase
  useEffect(() => {
    const loadSettings = async () => {
      if (!user) {
        console.log('Aucun utilisateur connecté, paramètres par défaut');
        setIsLoading(false);
        return;
      }

      try {
        console.log('Chargement des paramètres Kindle pour l\'utilisateur:', user.id);
        
        const { data: userData, error } = await supabase
          .from('users')
          .select('firstname, lastname, kindle_email')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Erreur lors du chargement des paramètres Kindle:', error);
          // Migration depuis localStorage si pas de données en base
          await migrateFromLocalStorage();
        } else if (userData) {
          const userSettings: KindleSettings = {
            firstName: userData.firstname || '',
            lastName: userData.lastname || '',
            kindleEmail: userData.kindle_email || '',
          };
          setSettings(userSettings);
          console.log('Paramètres Kindle chargés depuis Supabase:', userSettings);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres Kindle:', error);
        await migrateFromLocalStorage();
      } finally {
        setIsLoading(false);
      }
    };

    // Migration depuis localStorage vers Supabase
    const migrateFromLocalStorage = async () => {
      const storedSettings = localStorage.getItem('kindleSettings');
      if (storedSettings && user) {
        try {
          const parsed = JSON.parse(storedSettings);
          console.log('Migration des paramètres Kindle depuis localStorage:', parsed);
          
          // Sauvegarder en base de données
          const { error } = await supabase
            .from('users')
            .update({ 
              firstname: parsed.firstName || '',
              lastname: parsed.lastName || '',
              kindle_email: parsed.kindleEmail || ''
            })
            .eq('id', user.id);

          if (!error) {
            const migratedSettings: KindleSettings = {
              firstName: parsed.firstName || '',
              lastName: parsed.lastName || '',
              kindleEmail: parsed.kindleEmail || '',
            };
            setSettings(migratedSettings);
            
            // Supprimer de localStorage après migration réussie
            localStorage.removeItem('kindleSettings');
            console.log('Migration réussie, localStorage nettoyé');
          } else {
            console.error('Erreur lors de la migration:', error);
          }
        } catch (error) {
          console.error('Erreur lors de la migration depuis localStorage:', error);
        }
      }
    };

    loadSettings();
  }, [user]);

  return {
    settings,
    setSettings,
    isLoading
  };
};
