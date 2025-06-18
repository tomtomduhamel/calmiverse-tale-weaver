
import type { Story } from '@/types/story';

export const formatStoriesFromSupabase = (supabaseStories: any[]): Story[] => {
  return supabaseStories.map(story => formatStoryFromSupabase(story));
};

export const formatStoryFromSupabase = (story: any): Story => {
  return {
    id: story.id,
    id_stories: story.id,
    title: story.title || "Histoire sans titre",
    preview: story.preview || story.summary || "",
    objective: story.objective || "",
    childrenIds: story.childrenids || [],
    childrenNames: story.childrennames || [],
    createdAt: new Date(story.createdat),
    updatedAt: story.updatedat ? new Date(story.updatedat) : new Date(story.createdat),
    status: story.status || 'pending',
    content: story.content || "",
    story_summary: story.summary || "",
    authorId: story.authorid,
    error: story.error,
    tags: [],
    isFavorite: story.is_favorite || false,
    sharing: story.sharing,
    sound_id: story.sound_id,
    story_analysis: story.story_analysis
  };
};
