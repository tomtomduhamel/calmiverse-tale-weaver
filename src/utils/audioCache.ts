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
   * Récupère un fichier audio Blob du cache
   */
  async get(storyId: string): Promise<Blob | null> {
    try {
      const db = await initDB();
      return new Promise((resolve) => {
        const transaction = db.transaction([STORE_NAME], "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(storyId);

        request.onsuccess = () => {
          const blob = request.result as Blob | undefined;
          if (blob) {
            console.log(`⚡ [AudioCache] Audio récupéré du cache pour l'histoire : ${storyId}`);
            resolve(blob);
          } else {
            resolve(null);
          }
        };

        request.onerror = () => {
          console.warn(`⚠️ [AudioCache] Fichier introuvable dans le cache pour l'histoire : ${storyId}`);
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
  async prefetchAndCache(storyId: string, signedUrl: string): Promise<Blob | null> {
    try {
      // 1. Vérifier si l'audio est déjà dans le cache
      const cachedBlob = await this.get(storyId);
      if (cachedBlob) {
        return cachedBlob;
      }

      // 2. Si absent, le télécharger depuis l'URL signée
      console.log(`🌐 [AudioCache] Pré-chargement réseau de l'audio pour l'histoire : ${storyId}`);
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
  async has(storyId: string): Promise<boolean> {
    const blob = await this.get(storyId);
    return blob !== null;
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
  }
};
