
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { z } from 'zod';
import { KindleSettings, KindleSettingsUpdateResult } from './types';

const kindleSettingsSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  kindleEmail: z.string()
    .email("Format d'email invalide")
    .regex(/@kindle\.com$/, "L'email doit se terminer par @kindle.com")
});

export const useUpdateKindleSettings = (
  settings: KindleSettings,
  setSettings: React.Dispatch<React.SetStateAction<KindleSettings>>
) => {
  const { user } = useSupabaseAuth();

  const updateSettings = async (newSettings: Partial<KindleSettings>): Promise<KindleSettingsUpdateResult> => {
    if (!user) {
      return { success: false, errors: [{ message: "Utilisateur non connecté" }] };
    }

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

      // Mettre à jour en base de données
      const { error } = await supabase
        .from('users')
        .update({
          firstname: validatedSettings.firstName,
          lastname: validatedSettings.lastName,
          kindle_email: validatedSettings.kindleEmail
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      
      // Mettre à jour l'état local
      setSettings(validatedSettings);
      console.log('Paramètres Kindle sauvegardés avec succès en base:', validatedSettings);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres Kindle:', error);
      
      if (error instanceof z.ZodError) {
        return { success: false, errors: error.errors };
      }
      return { success: false, errors: [{ message: "Une erreur est survenue" }] };
    }
  };

  return { updateSettings };
};
