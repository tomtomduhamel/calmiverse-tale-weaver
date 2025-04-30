
/**
 * @deprecated Ce fichier est maintenu uniquement pour la compatibilité.
 */

// Transformer les données d'un enfant pour Supabase
export const transformChildForSupabase = (data: any, supabaseUid: string) => {
  return {
    name: data.name,
    birthdate: data.birthDate,
    authorid: supabaseUid,
    createdat: new Date().toISOString()
  };
};

// Transformer les données d'une histoire pour Supabase
export const transformStoryForSupabase = (data: any, supabaseUid: string) => {
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
