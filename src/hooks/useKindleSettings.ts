
import { useState, useEffect } from 'react';
import { z } from 'zod';

export interface KindleSettings {
  firstName: string;
  lastName: string;
  kindleEmail: string;
}

const kindleSettingsSchema = z.object({
  firstName: z.string().optional(), // Modification ici pour permettre des valeurs optionnelles
  lastName: z.string().optional(),  // Modification ici pour permettre des valeurs optionnelles
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

  useEffect(() => {
    const storedSettings = localStorage.getItem('kindleSettings');
    if (storedSettings) {
      try {
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
        }
      } catch (error) {
        console.error('Erreur lors du chargement des paramètres:', error);
      }
    }
  }, []);

  const updateSettings = async (newSettings: Partial<KindleSettings>) => {
    try {
      // Fusionner les paramètres existants avec les nouveaux paramètres
      const mergedSettings = {
        ...settings,
        ...newSettings,
      };
      
      const validated = await kindleSettingsSchema.parseAsync(mergedSettings);
      
      // Ensure all properties are present
      const validatedSettings: KindleSettings = {
        firstName: validated.firstName || '',
        lastName: validated.lastName || '',
        kindleEmail: validated.kindleEmail,
      };
      
      setSettings(validatedSettings);
      localStorage.setItem('kindleSettings', JSON.stringify(validatedSettings));
      return { success: true };
    } catch (error) {
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
