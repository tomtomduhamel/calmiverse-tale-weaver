
import { useState, useEffect } from 'react';
import { z } from 'zod';

export interface KindleSettings {
  firstName: string;
  lastName: string;
  kindleEmail: string;
}

const kindleSettingsSchema = z.object({
  firstName: z.string().optional(), // Valeurs optionnelles
  lastName: z.string().optional(),  // Valeurs optionnelles
  kindleEmail: z.string()
    .email("Format d'email invalide")
    .regex(/@kindle\.com$/, "L'email doit se terminer par @kindle.com")
});

export const useKindleSettings = () => {
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

  // Mettre à jour les paramètres
  const updateSettings = async (newSettings: Partial<KindleSettings>) => {
    try {
      console.log('Mise à jour des paramètres Kindle:', newSettings);
      
      // Fusionner les paramètres existants avec les nouveaux paramètres
      const mergedSettings = {
        ...settings,
        ...newSettings,
      };
      
      console.log('Paramètres Kindle fusionnés:', mergedSettings);
      
      // Validation des paramètres fusionnés
      const validated = await kindleSettingsSchema.parseAsync(mergedSettings);
      
      // S'assurer que toutes les propriétés sont présentes
      const validatedSettings: KindleSettings = {
        firstName: validated.firstName || '',
        lastName: validated.lastName || '',
        kindleEmail: validated.kindleEmail,
      };
      
      // Mettre à jour l'état local et localStorage
      setSettings(validatedSettings);
      localStorage.setItem('kindleSettings', JSON.stringify(validatedSettings));
      console.log('Paramètres Kindle sauvegardés avec succès:', validatedSettings);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres Kindle:', error);
      
      if (error instanceof z.ZodError) {
        return { success: false, errors: error.errors };
      }
      return { success: false, errors: [{ message: "Une erreur est survenue" }] };
    }
  };

  const isConfigured = Boolean(settings.kindleEmail);

  return {
    settings,
    updateSettings,
    isConfigured,
  };
};
