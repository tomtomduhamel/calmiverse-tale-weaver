
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité.
 */

import { supabase } from '@/integrations/supabase/client';

// Stub de transformer pour la compatibilité
const transformChildForSupabase = (data: any, supabaseUid: string) => {
  return {
    name: data.name,
    birthdate: data.birthDate,
    authorid: supabaseUid,
    createdat: new Date().toISOString()
  };
};

/**
 * Fonction de migration obsolète - maintenue pour compatibilité
 */
export const migrateChildren = async (firebaseUid: string) => {
  console.warn("La fonction migrateChildren est obsolète. La migration a été terminée.");
  return { success: true };
};
