/**
 * Idempotency & Mutex Guard pour protéger contre les doubles clics,
 * les retries concurrents et la double consommation de quotas.
 */

interface LockEntry {
  promise: Promise<any>;
  timestamp: number;
  expiresAt: number;
}

class IdempotencyManager {
  private activeLocks = new Map<string, LockEntry>();

  /**
   * Génère une clé d'idempotence déterministe pour la création d'histoire
   */
  generateStoryKey(userId: string, childrenIds: string[], identifier: string): string {
    const sortedChildren = [...childrenIds].sort().join(',');
    const cleanId = identifier.trim().toLowerCase().slice(0, 50);
    return `story_gen:${userId}:${sortedChildren}:${cleanId}`;
  }

  /**
   * Génère une clé d'idempotence pour la synthèse audio
   */
  generateAudioKey(storyId: string, voiceId: string): string {
    return `audio_gen:${storyId}:${voiceId}`;
  }

  /**
   * Exécute une opération asynchrone protégée par verrou d'idempotence.
   * Si une opération identique est déjà en cours, réutilise la même promesse.
   */
  async runWithLock<T>(
    key: string, 
    operation: () => Promise<T>, 
    ttlMs: number = 15000
  ): Promise<T> {
    const now = Date.now();
    const existing = this.activeLocks.get(key);

    // Si une opération valide est déjà en cours d'exécution
    if (existing && existing.expiresAt > now) {
      console.log(`🔒 [IdempotencyGuard] Verrou actif détecté pour "${key}". Réutilisation de la promesse en cours.`);
      return existing.promise as Promise<T>;
    }

    // Création d'un nouveau verrou
    console.log(`🔑 [IdempotencyGuard] Acquisition du verrou pour "${key}" (TTL: ${ttlMs}ms)`);
    
    const promise = (async () => {
      try {
        return await operation();
      } finally {
        // Libération automatique après un délai de grâce court pour absorber les micro-rebonds
        setTimeout(() => {
          this.activeLocks.delete(key);
          console.log(`🔓 [IdempotencyGuard] Verrou libéré pour "${key}"`);
        }, 2000);
      }
    })();

    this.activeLocks.set(key, {
      promise,
      timestamp: now,
      expiresAt: now + ttlMs,
    });

    return promise;
  }

  /**
   * Vérifie si un verrou est actuellement posé
   */
  isLocked(key: string): boolean {
    const entry = this.activeLocks.get(key);
    if (!entry) return false;
    return entry.expiresAt > Date.now();
  }
}

export const idempotencyGuard = new IdempotencyManager();
