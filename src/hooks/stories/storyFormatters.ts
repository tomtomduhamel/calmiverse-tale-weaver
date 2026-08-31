
import type { Story } from '@/types/story';

export const formatStoriesFromSupabase = (supabaseStories: any[]): Story[] => {
  return supabaseStories.map(story => formatStoryFromSupabase(story));
};

export const formatStoryFromSupabase = (story: any): Story => {
  if (!story) {
    return {
      id: '',
      title: 'Histoire sans titre',
      preview: '',
      objective: '',
      childrenIds: [],
      childrenNames: [],
      createdAt: new Date(),
      status: 'ready',
      content: '',
      story_summary: '',
      tags: [],
    };
  }

  const rawCreatedAt = story.createdat || story.created_at || story.createdAt;
  const rawUpdatedAt = story.updatedat || story.updated_at || story.updatedAt || rawCreatedAt;

  return {
    id: story.id,
    id_stories: story.id_stories || story.id,
    title: story.title || "Histoire sans titre",
    preview: story.preview || story.summary || story.story_summary || "",
    objective: story.objective || "",
    childrenIds: story.childrenids || story.children_ids || story.childrenIds || [],
    childrenNames: story.childrennames || story.children_names || story.childrenNames || [],
    createdAt: rawCreatedAt ? new Date(rawCreatedAt) : new Date(),
    updatedAt: rawUpdatedAt ? new Date(rawUpdatedAt) : new Date(),
    status: story.status || 'pending',
    content: story.content || story.story_text || "",
    story_summary: story.story_summary || story.summary || "",
    authorId: story.authorid || story.author_id || story.authorId,
    error: story.error,
    tags: story.tags || [],
    isFavorite: story.is_favorite ?? story.isFavorite ?? false,
    sharing: story.sharing,
    sound_id: story.sound_id ?? story.soundId ?? null,
    story_analysis: story.story_analysis || story.storyAnalysis,
    image_path: story.image_path || story.imagePath || null,
    video_path: story.video_path || story.videoPath || null,
    settings: story.settings || undefined,
    // Champs pour les séries - CORRECTION MAJEURE
    series_id: story.series_id || story.seriesId || null,
    tome_number: story.tome_number ?? story.tomeNumber ?? null,
    is_series_starter: story.is_series_starter ?? story.isSeriesStarter ?? false,
    previous_story_id: story.previous_story_id || story.previousStoryId || null,
    next_story_id: story.next_story_id || story.nextStoryId || null,
    rating: story.rating || undefined,
    rating_comment: story.rating_comment || story.ratingComment || undefined
  };
};
