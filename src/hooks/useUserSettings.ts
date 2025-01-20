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
      if (!auth.currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
          setUserSettings(userDoc.data() as UserSettings);
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
    if (!auth.currentUser) return;
    
    try {
      setIsLoading(true);
      await updateDoc(doc(db, 'users', auth.currentUser.uid), newSettings);
      setUserSettings(prev => ({ ...prev, ...newSettings }));
      toast({
        title: "Succès",
        description: "Vos paramètres ont été mis à jour",
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres:', error);
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

  const exportUserData = async () => {
    if (!auth.currentUser) return;
    
    try {
      const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
      const userData = userDoc.data();
      const dataStr = JSON.stringify(userData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'mes-donnees.json';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur lors de l\'export des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'exporter vos données",
        variant: "destructive",
      });
    }
  };

  return {
    userSettings,
    isLoading,
    updateUserSettings,
    updateUserPassword,
    exportUserData,
  };
};