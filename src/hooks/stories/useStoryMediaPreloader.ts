import { useEffect } from 'react';
import { getStoryImageUrl, getStoryVideoUrl } from '@/utils/supabaseImageUtils';
import { assetOptimizer } from '@/utils/assetOptimizer';

interface StoryPreloadItem {
  image_path?: string | null;
  video_path?: string | null;
  audio_url?: string | null;
}

/**
 * Hook pour précharger les médias (images, vidéos, audios) d'une liste d'histoires
 * et remplir le cache local PWA/ServiceWorker pour un chargement instantané.
 */
export const useStoryMediaPreloader = (stories: StoryPreloadItem[]) => {
  useEffect(() => {
    if (!stories || stories.length === 0) return;

    const urlsToPreload: string[] = [];

    // Précharger les 5 premières histoires visibles ou suivantes
    stories.slice(0, 5).forEach((story) => {
      if (story.image_path) {
        const imgUrl = getStoryImageUrl(story.image_path);
        if (imgUrl) urlsToPreload.push(imgUrl);
      }

      if (story.video_path) {
        const vidUrl = getStoryVideoUrl(story.video_path);
        if (vidUrl) urlsToPreload.push(vidUrl);
      }

      if (story.audio_url) {
        urlsToPreload.push(story.audio_url);
      }
    });

    if (urlsToPreload.length > 0) {
      assetOptimizer.preloadCriticalAssets(urlsToPreload);
    }
  }, [stories]);
};
