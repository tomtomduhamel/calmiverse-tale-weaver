/**
 * Audio Cache Utility - Persistent Offline Storage for Story Audio
 * 
 * Ce module utilise IndexedDB pour stocker les fichiers audio des histoires
 * sous forme de Blobs. Cela permet de lire les histoires de manière 100% offline
 * et d'éviter les appels réseau réguliers pour récupérer des URLs signées expira-t-elles.
 */

const DB_NAME = "CalmiAudioCache";
const DB_VERSION = 1;
const STORE_NAME = "audios";

/**
 * Génère une clé de cache déterministe basée sur l'histoire et le fichier audio
 */
export function getAudioCacheKey(storyId: string, audioUrl?: string | null): string {
  if (audioUrl) {
    const filename = audioUrl.split('/').pop() || audioUrl;
    return `story_${storyId}_${filename}`;
  }
  return `story_${storyId}`;
}

/**
 * Initialise la base de données IndexedDB
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("❌ [AudioCache] Erreur d'ouverture d'IndexedDB :", event);
      reject(new Error("Impossible d'ouvrir la base de données de cache audio."));
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const audioCache = {
  /**
   * Sauvegarde un fichier audio Blob dans le cache local IndexedDB
   */
  async save(storyId: string, audioBlob: Blob): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(audioBlob, storyId);

        request.onsuccess = () => {
          console.log(`💾 [AudioCache] Audio sauvegardé pour l'histoire : ${storyId}`);
          resolve();
        };

        request.onerror = (event) => {
          console.error(`❌ [AudioCache] Échec de la sauvegarde pour l'histoire : ${storyId}`, event);
          reject(new Error("Échec d'écriture dans le cache audio"));
        };
      });
    } catch (error) {
      console.error("❌ [AudioCache] Erreur lors de la sauvegarde :", error);
    }
  },

  /**
   * Récupère un fichier audio Blob du cache avec validation optionnelle de taille
   */
  async get(storyId: string, expectedSize?: number | null): Promise<Blob | null> {
    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(storyId);

        request.onsuccess = () => {
          const blob = request.result as Blob | undefined;
          if (blob) {
            // Si une taille attendue est fournie et que le blob est manifestement tronqué (< 75% de la taille attendue)
            if (expectedSize && expectedSize > 0 && blob.size < expectedSize * 0.75) {
              console.warn(`⚠️ [AudioCache] Blob en cache tronqué (${blob.size} vs attendu ${expectedSize} octets). Invalidation immédiate.`);
              this.delete(storyId).catch(() => {});
              resolve(null);
              return;
            }
            console.log(`⚡ [AudioCache] Audio récupéré du cache pour : ${storyId} (${blob.size} octets)`);
            resolve(blob);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn(`⚠️ [AudioCache] Fichier introuvable dans le cache pour : ${storyId}`);
          resolve(null);
        };
      });
    } catch (error) {
      console.error("❌ [AudioCache] Erreur lors de la récupération :", error);
      return null;
    }
  },

  /**
   * Télécharge un audio depuis une URL signée et le met en cache de manière transparente
   */
  async prefetchAndCache(storyId: string, signedUrl: string, expectedSize?: number | null): Promise<Blob | null> {
    try {
      // 1. Vérifier si l'audio est déjà dans le cache valide
      const cachedBlob = await this.get(storyId, expectedSize);
      if (cachedBlob) {
        return cachedBlob;
      }

      // 2. Si absent ou corrompu, le télécharger depuis l'URL signée
      console.log(`🌐 [AudioCache] Pré-chargement réseau de l'audio pour : ${storyId}`);
      const response = await fetch(signedUrl);
      if (!response.ok) {
        throw new Error(`Erreur HTTP lors du téléchargement : ${response.status}`);
      }

      const audioBlob = await response.blob();
      
      // 3. Sauvegarder dans le cache local
      await this.save(storyId, audioBlob);
      return audioBlob;
    } catch (error) {
      console.error(`❌ [AudioCache] Échec de la mise en cache de l'audio (${storyId}) :`, error);
      return null;
    }
  },

  /**
   * Vérifie si un audio est actuellement présent dans le cache
   */
  async has(storyId: string, expectedSize?: number | null): Promise<boolean> {
    const blob = await this.get(storyId, expectedSize);
    return blob !== null;
  },

  /**
   * Supprime tous les caches associés à une histoire (toutes versions confondues)
   */
  async invalidateStory(storyId: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue | null;
          if (cursor) {
            const key = String(cursor.key);
            if (key === storyId || key.startsWith(`story_${storyId}`) || key.startsWith(storyId)) {
              cursor.delete();
            }
            cursor.continue();
          } else {
            console.log(`🧹 [AudioCache] Cache nettoyé pour l'histoire : ${storyId}`);
            resolve();
          }
        };

        request.onerror = () => resolve();
      });
    } catch (error) {
      console.warn("⚠️ [AudioCache] Erreur invalidateStory :", error);
    }
  },

  /**
   * Supprime un audio spécifique du cache local
   */
  async delete(storyId: string): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(storyId);

        request.onsuccess = () => {
          console.log(`🗑️ [AudioCache] Audio supprimé du cache pour l'histoire : ${storyId}`);
          resolve();
        };

        request.onerror = (event) => {
          reject(event);
        };
      });
    } catch (error) {
      console.error("❌ [AudioCache] Erreur lors de la suppression :", error);
    }
  },

  /**
   * Vide entièrement le cache des fichiers audio
   */
  async clear(): Promise<void> {
    try {
      const db = await initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          console.log("🧹 [AudioCache] Base de données de cache audio vidée.");
          resolve();
        };

        request.onerror = (event) => {
          reject(event);
        };
      });
    } catch (error) {
      console.error("❌ [AudioCache] Erreur lors du nettoyage du cache :", error);
    }
  },

  /**
   * Pré-télécharge de façon prédictive les histoires de routine du coucher
   * pour qu'elles soient disponibles instantanément sans Wi-Fi ni latence.
   */
  async prefetchRoutineStories(
    items: { storyId: string; signedUrl: string }[]
  ): Promise<number> {
    let cachedCount = 0;
    for (const item of items) {
      try {
        const cacheKey = `story_${item.storyId}`;
        const exists = await this.has(cacheKey);
        if (!exists && item.signedUrl) {
          console.log(`🌙 [AudioCache Routine] Pré-chargement prédictif de l'histoire ${item.storyId}...`);
          const blob = await this.prefetchAndCache(cacheKey, item.signedUrl);
          if (blob) cachedCount++;
        } else if (exists) {
          cachedCount++;
        }
      } catch (err) {
        console.warn(`[AudioCache Routine] Échec préfetch histoire ${item.storyId}:`, err);
      }
    }
    return cachedCount;
  }
};
