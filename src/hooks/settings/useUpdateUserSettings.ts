
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { UserSettings } from '@/types/user-settings';
import { errorManager } from '@/utils/errorHandling/errorNotificationManager';

export const useUpdateUserSettings = (
  setUserSettings: React.Dispatch<React.SetStateAction<UserSettings>>,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  const { toast } = useToast();
  const { user } = useSupabaseAuth();

  const updateUserSettings = async (newSettings: Partial<UserSettings>): Promise<void> => {
    if (!user) {
      const error = new Error('Tentative de mise à jour sans utilisateur connecté');
      console.error(error);
      toast({
        title: "Erreur d'authentification",
        description: "Vous devez être connecté pour modifier vos paramètres",
        variant: "destructive",
      });
      throw error;
    }
    
    try {
      setIsLoading(true);
      console.log('Mise à jour des paramètres pour:', user.id);
      console.log('Nouvelles valeurs:', newSettings);
      
      // Validation des données
      if (newSettings.firstName !== undefined && !newSettings.firstName.trim()) {
        throw new Error('Le prénom ne peut pas être vide');
      }
      
      if (newSettings.lastName !== undefined && !newSettings.lastName.trim()) {
        throw new Error('Le nom ne peut pas être vide');
      }
      
      // Mappage des propriétés UserSettings vers la structure de la table Supabase
      const supabaseData: Record<string, any> = {};
      
      if (newSettings.firstName !== undefined) supabaseData.firstname = newSettings.firstName.trim();
      if (newSettings.lastName !== undefined) supabaseData.lastname = newSettings.lastName.trim();
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
      
      // Mappage des préférences de lecture
      if (newSettings.readingPreferences?.autoScrollEnabled !== undefined)
        supabaseData.auto_scroll_enabled = newSettings.readingPreferences.autoScrollEnabled;
      if (newSettings.readingPreferences?.readingSpeed !== undefined)
        supabaseData.reading_speed = newSettings.readingPreferences.readingSpeed;
      
      // Vérifier si l'utilisateur existe déjà dans la table
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 signifie simplement "pas de résultat", ce n'est pas une vraie erreur
        console.error('Erreur lors de la vérification du profil:', checkError);
        throw new Error('Impossible de vérifier votre profil: ' + checkError.message);
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
            email: user.email || ''
          });
          
        error = result.error;
      }
      
      if (error) {
        console.error('Erreur détaillée lors de la sauvegarde:', error);
        throw new Error('Erreur lors de la sauvegarde des données: ' + error.message);
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
      
      // Utiliser le gestionnaire d'erreur centralisé
      if (error instanceof Error) {
        errorManager.handleError(error, 'database');
      }
      
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de mettre à jour vos paramètres",
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateUserSettings };
};
