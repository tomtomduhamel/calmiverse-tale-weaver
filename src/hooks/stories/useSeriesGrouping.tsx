import { useMemo } from 'react';
import type { Story, LibraryItem, SeriesGroup, StandaloneStory } from '@/types/story';
import { useSeriesData } from './useSeriesData';

interface UseSeriesGroupingReturn {
  libraryItems: LibraryItem[];
  totalItems: number;
  seriesCount: number;
  standaloneCount: number;
  isLoading: boolean;
}

export const useSeriesGrouping = (stories: Story[]): UseSeriesGroupingReturn => {
  // Extraire les IDs de série uniques
  const seriesIds = useMemo(() => {
    const ids = new Set<string>();
    stories.forEach(story => {
      if (story.series_id && story.tome_number) {
        ids.add(story.series_id);
      }
    });
    return Array.from(ids);
  }, [stories]);

  // Récupérer les données de série depuis la base de données
  const { seriesData, isLoading } = useSeriesData(seriesIds);
  const libraryItems = useMemo(() => {
    // Attendre que les données de série soient chargées
    if (isLoading) {
      return [];
    }

    const seriesMap = new Map<string, Story[]>();
    const standaloneStories: Story[] = [];

    // Grouper les histoires par série
    stories.forEach(story => {
      if (story.series_id && story.tome_number) {
        if (!seriesMap.has(story.series_id)) {
          seriesMap.set(story.series_id, []);
        }
        seriesMap.get(story.series_id)!.push(story);
      } else {
        standaloneStories.push(story);
      }
    });

    const items: LibraryItem[] = [];

    // Créer les groupes de séries (seulement si 2 tomes ou plus)
    seriesMap.forEach((seriesStories, seriesId) => {
      if (seriesStories.length >= 2) {
        // Trier les histoires par tome_number
        const sortedStories = seriesStories.sort((a, b) => (a.tome_number || 0) - (b.tome_number || 0));
        const firstStory = sortedStories[0];
        
        // Calculer les statistiques
        const readStories = sortedStories.filter(story => story.status === 'read').length;
        const lastUpdated = sortedStories.reduce((latest, story) => {
          const storyDate = story.updatedAt ? story.updatedAt.toISOString() : story.createdAt.toISOString();
          return storyDate > latest ? storyDate : latest;
        }, sortedStories[0].updatedAt ? sortedStories[0].updatedAt.toISOString() : sortedStories[0].createdAt.toISOString());

        const seriesInfo = seriesData.get(seriesId);
        
        if (!seriesInfo) {
          // Fallback si les données de série ne sont pas trouvées
          console.warn(`❌ Données de série non trouvées pour ${seriesId}`);
          return;
        }

        const seriesGroup: SeriesGroup = {
          id: seriesId,
          type: 'series',
          series: seriesInfo,
          stories: sortedStories,
          totalStories: sortedStories.length,
          readStories,
          lastUpdated,
          coverImage: seriesInfo.image_path || firstStory.image_path || undefined,
        };

        items.push(seriesGroup);
      } else if (seriesStories.length === 1) {
        // Si une série n'a qu'un seul tome, la traiter comme une histoire standalone
        standaloneStories.push(seriesStories[0]);
      }
    });

    // Ajouter les histoires autonomes
    standaloneStories.forEach(story => {
      const standaloneItem: StandaloneStory = {
        id: story.id,
        type: 'story',
        story,
      };
      items.push(standaloneItem);
    });

    // Trier par date de mise à jour (plus récent d'abord)
    items.sort((a, b) => {
      const dateA = a.type === 'series' ? a.lastUpdated : (a.story.updatedAt ? a.story.updatedAt.toISOString() : a.story.createdAt.toISOString());
      const dateB = b.type === 'series' ? b.lastUpdated : (b.story.updatedAt ? b.story.updatedAt.toISOString() : b.story.createdAt.toISOString());
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    return items;
  }, [stories, seriesData, isLoading]);

  const seriesCount = libraryItems.filter(item => item.type === 'series').length;
  const standaloneCount = libraryItems.filter(item => item.type === 'story').length;

  return {
    libraryItems,
    totalItems: libraryItems.length,
    seriesCount,
    standaloneCount,
    isLoading,
  };
};