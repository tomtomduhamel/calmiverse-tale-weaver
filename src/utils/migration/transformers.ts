
/**
 * Utilitaires de transformation des données entre Firebase et Supabase
 */

// Transformation des noms de champs pour respecter la convention Supabase (tout en minuscule)
export const transformChildForSupabase = (childData: any, supabaseUid: string) => {
  return {
    name: childData.name,
    birthdate: childData.birthDate ? new Date(childData.birthDate.toDate()).toISOString() : new Date().toISOString(),
    authorid: supabaseUid,
    interests: childData.interests || [],
    gender: childData.gender || 'unknown',
    createdat: new Date().toISOString()
  };
};

export const transformStoryForSupabase = (storyData: any, supabaseUid: string) => {
  return {
    title: storyData.title || "Histoire sans titre",
    content: storyData.story_text || storyData.content || "",
    summary: storyData.story_summary || storyData.summary || "",
    preview: storyData.preview || "",
    status: storyData.status || "completed",
    childrenids: storyData.childrenIds || [],
    childrennames: storyData.childrenNames || [],
    objective: storyData.objective 
      ? (typeof storyData.objective === 'object' ? storyData.objective.value : storyData.objective) 
      : "",
    authorid: supabaseUid,
    createdat: storyData.createdAt 
      ? new Date(storyData.createdAt.toDate()).toISOString() 
      : new Date().toISOString(),
    updatedat: new Date().toISOString()
  };
};
