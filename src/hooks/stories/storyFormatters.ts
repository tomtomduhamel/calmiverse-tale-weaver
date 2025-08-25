
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
    story_analysis: story.story_analysis,
    image_path: story.image_path || null,
    // Champs pour les séries - CORRECTION MAJEURE
    series_id: story.series_id || null,
    tome_number: story.tome_number || null,
    is_series_starter: story.is_series_starter || false,
    previous_story_id: story.previous_story_id || null,
    next_story_id: story.next_story_id || null
  };
};
