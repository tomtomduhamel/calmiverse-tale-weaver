
/**
 * Utilitaires pour formater les données des histoires
 */

/**
 * Crée un objet de données d'histoire pour l'insertion dans Supabase
 */
export const createStoryData = (formData: { childrenIds: string[], objective: string }, childrenNames: string[]) => {
  return {
    title: `Histoire pour ${childrenNames.join(' et ')}`,
    content: '',
    summary: 'Génération en cours...',
    preview: 'Histoire en cours de création...',
    status: 'pending',
    childrenids: formData.childrenIds,
    childrennames: childrenNames,
    objective: formData.objective,
    authorid: '', // Sera ajouté dans le hook
    createdat: new Date().toISOString(),
    updatedat: new Date().toISOString()
  };
};

/**
 * Transforme un objet story de Supabase vers le format interne de l'app
 */
export const formatStoryFromSupabase = (story: any) => {
  return {
    id: story.id,
    title: story.title || 'Nouvelle histoire',
    preview: story.preview || '',
    objective: story.objective || '',
    childrenIds: story.childrenids || [],
    childrenNames: story.childrennames || [],
    createdAt: new Date(story.createdat),
    status: story.status || 'pending',
    story_text: story.content || '',
    story_summary: story.summary || '',
    authorId: story.authorid,
    error: story.error || null,
    tags: story.tags || [],
    updatedAt: story.updatedat ? new Date(story.updatedat) : undefined,
  };
};

/**
 * Formate une liste d'histoires de Supabase
 */
export const formatStoriesFromSupabase = (stories: any[]) => {
  return stories.map(story => formatStoryFromSupabase(story));
};
