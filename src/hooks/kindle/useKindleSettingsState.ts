
import { useState, useEffect } from 'react';
import { z } from 'zod';
import { KindleSettings } from './types';

const kindleSettingsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  kindleEmail: z.string()
    .email("Format d'email invalide")
    .regex(/@kindle\.com$/, "L'email doit se terminer par @kindle.com")
});

export const useKindleSettingsState = () => {
  const [settings, setSettings] = useState<KindleSettings>({
    firstName: '',
    lastName: '',
    kindleEmail: '',
  });

  // Charger les paramètres depuis localStorage au montage
  useEffect(() => {
    const loadSettings = () => {
      const storedSettings = localStorage.getItem('kindleSettings');
      if (storedSettings) {
        try {
          console.log('Chargement des paramètres Kindle depuis localStorage');
          const parsed = JSON.parse(storedSettings);
          const validated = kindleSettingsSchema.safeParse(parsed);
          if (validated.success) {
            // Ensure all required properties are present
            const validatedSettings: KindleSettings = {
              firstName: validated.data.firstName || '',
              lastName: validated.data.lastName || '',
              kindleEmail: validated.data.kindleEmail || '',
            };
            setSettings(validatedSettings);
            console.log('Paramètres Kindle chargés:', validatedSettings);
          } else {
            console.error('Validation des paramètres Kindle échouée:', validated.error);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des paramètres Kindle:', error);
        }
      }
    };

    loadSettings();
  }, []);

  return {
    settings,
    setSettings
  };
};
