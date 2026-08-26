import Dexie, { type EntityTable } from 'dexie';
import { supabase } from '@/integrations/supabase/client';
import type { Story } from '@/types/story';

export interface OfflineStoryRecord {
  id: string;
  title: string;
  content: string;
  preview: string;
  authorid?: string;
  is_favorite?: boolean;
  objective?: string;
  childrenids?: string[];
  createdat: string;
  updatedat?: string;
  status: string;
  cover_url?: string | null;
}

export interface OfflineAudioRecord {
  storyId: string;
  audioBlob: Blob;
  mimeType: string;
  originalUrl: string;
  cachedAt: number;
  duration?: number | null;
}

export interface PendingOfflineRating {
  id?: number;
  storyId: string;
  userId: string;
  rating: number;
  comment?: string;
  createdAt: number;
}

// Initialisation de la BDD Dexie
class CalmiOfflineDatabase extends Dexie {
  stories!: EntityTable<OfflineStoryRecord, 'id'>;
  audioCache!: EntityTable<OfflineAudioRecord, 'storyId'>;
  pendingRatings!: EntityTable<PendingOfflineRating, 'id'>;

  constructor() {
    super('calmi_bedtime_offline_db');
    this.version(1).stores({
      stories: 'id, authorid, is_favorite, createdat, status',
      audioCache: 'storyId, cachedAt',
      pendingRatings: '++id, storyId, userId, createdAt',
    });
  }
}

export const offlineDb = new CalmiOfflineDatabase();

export const offlineStorageService = {
  /**
   * Sauvegarde une liste d'histoires en local pour lecture hors-ligne
   */
  async cacheStories(stories: (Story | any)[]): Promise<void> {
    try {
      const records: OfflineStoryRecord[] = stories.map((s) => ({
        id: s.id,
        title: s.title || 'Histoire',
        content: s.content || '',
        preview: s.preview || s.summary || '',
        authorid: s.authorid,
        is_favorite: s.is_favorite ?? false,
        objective: s.objective || 'sleep',
        childrenids: s.childrenids || s.childrenIds || [],
        createdat: s.createdat || (s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString()),
        updatedat: s.updatedat || new Date().toISOString(),
        status: s.status || 'completed',
        cover_url: s.cover_url || null,
      }));

      await offlineDb.stories.bulkPut(records);
      console.log(`📴 [OfflineStorage] ${records.length} histoire(s) mise(s) en cache local.`);
    } catch (err) {
      console.warn('[OfflineStorage] Erreur mise en cache des histoires:', err);
    }
  },

  /**
   * Récupère toutes les histoires disponibles hors-ligne
   */
  async getOfflineStories(): Promise<OfflineStoryRecord[]> {
    try {
      return await offlineDb.stories.orderBy('createdat').reverse().toArray();
    } catch (err) {
      console.warn('[OfflineStorage] Erreur lecture des histoires locales:', err);
      return [];
    }
  },

  /**
   * Récupère une histoire spécifique depuis le cache local
   */
  async getOfflineStory(storyId: string): Promise<OfflineStoryRecord | undefined> {
    try {
      return await offlineDb.stories.get(storyId);
    } catch (err) {
      console.warn(`[OfflineStorage] Erreur lecture histoire ${storyId}:`, err);
      return undefined;
    }
  },

  /**
   * Télécharge et met en cache la piste audio d'une histoire
   */
  async cacheStoryAudio(storyId: string, audioUrl: string): Promise<boolean> {
    if (!audioUrl || !storyId) return false;

    try {
      console.log(`🎙️ [OfflineStorage] Mise en cache audio pour l'histoire: ${storyId}`);
      const response = await fetch(audioUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const blob = await response.blob();
      await offlineDb.audioCache.put({
        storyId,
        audioBlob: blob,
        mimeType: blob.type || 'audio/mpeg',
        originalUrl: audioUrl,
        cachedAt: Date.now(),
      });

      console.log(`✅ [OfflineStorage] Audio mis en cache avec succès (${Math.round(blob.size / 1024)} Ko).`);
      return true;
    } catch (err) {
      console.warn(`[OfflineStorage] Échec mise en cache audio pour ${storyId}:`, err);
      return false;
    }
  },

  /**
   * Récupère l'URL locale Blob d'un audio mis en cache
   */
  async getOfflineAudioBlobUrl(storyId: string): Promise<string | null> {
    try {
      const record = await offlineDb.audioCache.get(storyId);
      if (!record || !record.audioBlob) return null;
      return URL.createObjectURL(record.audioBlob);
    } catch (err) {
      console.warn(`[OfflineStorage] Erreur récupération blob audio ${storyId}:`, err);
      return null;
    }
  },

  /**
   * Vérifie si une histoire et son audio sont disponibles hors-ligne
   */
  async checkOfflineAvailability(storyId: string): Promise<{ hasText: boolean; hasAudio: boolean }> {
    try {
      const [story, audio] = await Promise.all([
        offlineDb.stories.get(storyId),
        offlineDb.audioCache.get(storyId),
      ]);
      return {
        hasText: Boolean(story && story.content && story.content.length > 50),
        hasAudio: Boolean(audio && audio.audioBlob),
      };
    } catch {
      return { hasText: false, hasAudio: false };
    }
  },

  /**
   * Enfile une note parent lorsque l'appareil est hors-ligne
   */
  async queueOfflineRating(storyId: string, userId: string, rating: number, comment?: string): Promise<void> {
    try {
      await offlineDb.pendingRatings.add({
        storyId,
        userId,
        rating,
        comment,
        createdAt: Date.now(),
      });
      console.log(`⭐ [OfflineStorage] Note ${rating}⭐ enfilée pour synchronisation ultérieure.`);
    } catch (err) {
      console.warn('[OfflineStorage] Erreur enregistrement note hors-ligne:', err);
    }
  },

  /**
   * Synchronise les notes en attente avec Supabase dès le retour du réseau
   */
  async syncPendingRatings(): Promise<number> {
    try {
      const pending = await offlineDb.pendingRatings.toArray();
      if (pending.length === 0) return 0;

      console.log(`🔄 [OfflineStorage] Synchronisation de ${pending.length} note(s) en attente...`);
      let syncedCount = 0;

      for (const item of pending) {
        if (!item.id) continue;
        const { error } = await supabase
          .from('stories')
          .update({
            rating: item.rating,
            rating_comment: item.comment || null,
            updatedat: new Date().toISOString(),
          })
          .eq('id', item.storyId);

        if (!error) {
          await offlineDb.pendingRatings.delete(item.id);
          syncedCount++;
        }
      }

      if (syncedCount > 0) {
        console.log(`✅ [OfflineStorage] ${syncedCount} note(s) synchronisée(s) avec Supabase.`);
      }
      return syncedCount;
    } catch (err) {
      console.warn('[OfflineStorage] Erreur synchronisation des notes:', err);
      return 0;
    }
  },
};
