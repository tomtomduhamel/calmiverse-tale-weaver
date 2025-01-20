import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { UserSettings, SecuritySettings } from '@/types/user-settings';
import { useToast } from '@/hooks/use-toast';

export const useUserSettings = () => {
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

  useEffect(() => {
    const loadUserSettings = async () => {
      if (!auth.currentUser) {
        console.log('Aucun utilisateur connecté');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Chargement des paramètres pour:', auth.currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        
        if (userDoc.exists()) {
          console.log('Document utilisateur trouvé:', userDoc.data());
          setUserSettings(userDoc.data() as UserSettings);
        } else {
          console.log('Aucun document utilisateur trouvé, utilisation des valeurs par défaut');
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
  }, [toast]);

  const updateUserSettings = async (newSettings: Partial<UserSettings>) => {
    if (!auth.currentUser) {
      console.error('Tentative de mise à jour sans utilisateur connecté');
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Mise à jour des paramètres pour:', auth.currentUser.uid);
      console.log('Nouvelles valeurs:', newSettings);
      
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, newSettings);
      
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
        description: "Impossible de mettre à jour vos paramètres",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserPassword = async ({ currentPassword, newPassword }: SecuritySettings) => {
    if (!auth.currentUser?.email) return;
    
    try {
      setIsLoading(true);
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email,
        currentPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      await updatePassword(auth.currentUser, newPassword);
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