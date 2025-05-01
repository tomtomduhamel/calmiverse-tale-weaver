
import type { Story } from "@/types/story";

export function formatStoriesFromSupabase(stories: any[]): Story[] {
  return stories.map(story => formatStoryFromSupabase(story));
}

export function formatStoryFromSupabase(story: any): Story {
  return {
    id: story.id,
    id_stories: story.id,
    title: story.title || 'Nouvelle histoire',
    preview: story.preview || '',
    objective: story.objective || '',
    childrenIds: story.childrenids || [],
    childrenNames: story.childrennames || [],
    createdAt: new Date(story.createdat),
    status: story.status || 'completed',
    story_text: story.content || '',
    story_summary: story.summary || '',
    authorId: story.authorid,
    error: story.error || null,
    tags: story.tags || [],
    updatedAt: story.updatedat ? new Date(story.updatedat) : new Date(),
  };
}
