
/**
 * Formats the generated story data into the required structure
 */
export const formatStoryData = (storyText: string, childrenNames: string[], objective: string) => {
  console.log("Formatage des données de l'histoire");
  
  // Generate a unique ID for the story
  const uniqueId = `story_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id_stories: uniqueId,
    story_text: storyText,
    story_summary: "Résumé en cours de génération...",
    status: 'completed',
    createdAt: new Date(),
    title: "Nouvelle histoire pour " + childrenNames.join(" et "),
    preview: storyText.substring(0, 200) + "...",
    childrenNames: childrenNames,
    objective: objective
  };
};
