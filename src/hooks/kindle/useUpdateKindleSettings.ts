
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
      console.error('Utilisateur non connecté pour la mise à jour des paramètres Kindle');
      return { success: false, errors: [{ message: "Utilisateur non connecté" }] };
    }

    try {
      console.log('Début de la mise à jour des paramètres Kindle:', newSettings);
      
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

      console.log('Paramètres validés, tentative de sauvegarde en base:', validatedSettings);

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
        console.error('Erreur Supabase lors de la mise à jour:', error);
        throw new Error(`Erreur de base de données: ${error.message}`);
      }
      
      // Mettre à jour l'état local
      setSettings(validatedSettings);
      console.log('Paramètres Kindle sauvegardés avec succès:', validatedSettings);
      
      return { success: true };
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres Kindle:', error);
      
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => ({ message: err.message }));
        return { success: false, errors: errorMessages };
      }
      
      const errorMessage = error instanceof Error ? error.message : "Une erreur inconnue est survenue";
      return { success: false, errors: [{ message: errorMessage }] };
    }
  };

  return { updateSettings };
};
