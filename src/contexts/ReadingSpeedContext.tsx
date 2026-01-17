import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useUserSettings } from '@/hooks/settings/useUserSettings';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ReadingSpeedContextType {
  readingSpeed: number;
  setReadingSpeed: (speed: number) => Promise<void>;
}

const ReadingSpeedContext = createContext<ReadingSpeedContextType | undefined>(undefined);

export const ReadingSpeedProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { userSettings } = useUserSettings();
  const { user } = useSupabaseAuth();
  
  // État local partagé pour la vitesse de lecture (défaut: 120 = vitesse Tortue/Normal)
  const [readingSpeed, setLocalSpeed] = useState<number>(
    userSettings?.readingPreferences?.readingSpeed || 120
  );
  
  // Synchroniser avec les paramètres utilisateur au chargement initial
  useEffect(() => {
    if (userSettings?.readingPreferences?.readingSpeed) {
      setLocalSpeed(userSettings.readingPreferences.readingSpeed);
      console.log(`[ReadingSpeedContext] Vitesse initialisée: ${userSettings.readingPreferences.readingSpeed} mots/min`);
    }
  }, [userSettings?.readingPreferences?.readingSpeed]);
  
  // Fonction pour changer la vitesse (met à jour état local + BDD)
  const setReadingSpeed = useCallback(async (newSpeed: number) => {
    // Mise à jour immédiate de l'état local pour feedback instantané
    setLocalSpeed(newSpeed);
    console.log(`[ReadingSpeedContext] Changement vitesse: ${newSpeed} mots/min`);
    
    // Persistance en base de données (silencieuse)
    if (user) {
      try {
        const { error } = await supabase
          .from('users')
          .update({ reading_speed: newSpeed })
          .eq('id', user.id);
        
        if (error) {
          console.error('[ReadingSpeedContext] Erreur sauvegarde:', error);
        } else {
          console.log(`[ReadingSpeedContext] Vitesse sauvegardée en BDD: ${newSpeed} mots/min`);
        }
      } catch (error) {
        console.error('[ReadingSpeedContext] Erreur lors de la sauvegarde:', error);
      }
    }
  }, [user]);
  
  return (
    <ReadingSpeedContext.Provider value={{ readingSpeed, setReadingSpeed }}>
      {children}
    </ReadingSpeedContext.Provider>
  );
};

export const useReadingSpeed = () => {
  const context = useContext(ReadingSpeedContext);
  if (!context) {
    throw new Error('useReadingSpeed doit être utilisé dans un ReadingSpeedProvider');
  }
  return context;
};
