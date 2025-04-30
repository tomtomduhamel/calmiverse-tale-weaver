
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité.
 */

import { supabase } from '@/integrations/supabase/client';

// Stub de transformer pour la compatibilité
const transformStoryForSupabase = (data: any, supabaseUid: string) => {
  return {
    title: data.title || 'Histoire sans titre',
    content: data.story_text || '',
    summary: data.story_summary || '',
    preview: data.preview || '',
    status: data.status || 'completed',
    childrenids: data.childrenIds || [],
    childrennames: data.childrenNames || [],
    objective: data.objective || '',
    authorid: supabaseUid,
    createdat: new Date().toISOString()
  };
};

/**
 * Fonction de migration obsolète - maintenue pour compatibilité
 */
export const migrateStories = async (firebaseUid: string) => {
  console.warn("La fonction migrateStories est obsolète. La migration a été terminée.");
  return { success: true };
};

// Export de la fonction de transformation pour la compatibilité
export { transformStoryForSupabase };
