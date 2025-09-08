/**
 * Cache Manager - Phase 3 Commercial Publication
 * Gestion avancée du cache pour optimisation des performances
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
  lastAccess: number;
}

interface CacheStats {
  totalEntries: number;
  hitRate: number;
  missRate: number;
  memoryUsage: number;
  oldestEntry: number;
  newestEntry: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000;
  private defaultTTL = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: number | null = null;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0
  };

  constructor(maxSize = 1000, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    this.startCleanup();
  }

  /**
   * Stocke une valeur dans le cache
   */
  set<T>(key: string, data: T, ttl?: number): void {
    const now = Date.now();
    const entryTTL = ttl || this.defaultTTL;

    // Éviction LRU si le cache est plein
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      ttl: entryTTL,
      hits: 0,
      lastAccess: now
    });
  }

  /**
   * Récupère une valeur du cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    const now = Date.now();
    
    // Vérifier l'expiration
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Mettre à jour les statistiques d'accès
    entry.hits++;
    entry.lastAccess = now;
    this.stats.hits++;
    
    return entry.data as T;
  }

  /**
   * Cache avec fonction de fallback
   */
  async getOrSet<T>(
    key: string, 
    fetcher: () => Promise<T>, 
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const data = await fetcher();
    this.set(key, data, ttl);
    return data;
  }

  /**
   * Supprime une entrée du cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Vide le cache
   */
  clear(): void {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Éviction LRU (Least Recently Used)
   */
  private evictLRU(): void {
    let oldestKey = '';
    let oldestAccess = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  /**
   * Nettoyage automatique des entrées expirées
   */
  private startCleanup(): void {
    this.cleanupInterval = window.setInterval(() => {
      const now = Date.now();
      const keysToDelete: string[] = [];

      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          keysToDelete.push(key);
        }
      }

      keysToDelete.forEach(key => this.cache.delete(key));
    }, 60000); // Nettoyage toutes les minutes
  }

  /**
   * Arrête le nettoyage automatique
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Statistiques du cache
   */
  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const now = Date.now();
    
    return {
      totalEntries: this.cache.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) * 100 || 0,
      missRate: this.stats.misses / (this.stats.hits + this.stats.misses) * 100 || 0,
      memoryUsage: this.estimateMemoryUsage(),
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : now,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : now
    };
  }

  /**
   * Estimation de l'utilisation mémoire
   */
  private estimateMemoryUsage(): number {
    let size = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Métadonnées estimées
    }
    
    return size;
  }

  /**
   * Remet à zéro les statistiques
   */
  private resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0
    };
  }

  /**
   * Cache spécialisé pour les histoires
   */
  cacheStory(storyId: string, story: any, duration = 10 * 60 * 1000): void {
    this.set(`story:${storyId}`, story, duration);
  }

  /**
   * Récupère une histoire du cache
   */
  getCachedStory(storyId: string): any | null {
    return this.get(`story:${storyId}`);
  }

  /**
   * Cache pour les profils enfants
   */
  cacheChildProfile(childId: string, profile: any, duration = 15 * 60 * 1000): void {
    this.set(`child:${childId}`, profile, duration);
  }

  /**
   * Récupère un profil enfant du cache
   */
  getCachedChildProfile(childId: string): any | null {
    return this.get(`child:${childId}`);
  }

  /**
   * Invalidation sélective par pattern
   */
  invalidatePattern(pattern: RegExp): number {
    let deletedCount = 0;
    
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
        deletedCount++;
      }
    }
    
    return deletedCount;
  }
}

// Instance globale du gestionnaire de cache
export const cacheManager = new CacheManager(2000, 10 * 60 * 1000);

// Cache spécialisé pour les requêtes API
export class APICache {
  private static instance: APICache;
  private cache = new CacheManager(500, 2 * 60 * 1000);

  static getInstance(): APICache {
    if (!APICache.instance) {
      APICache.instance = new APICache();
    }
    return APICache.instance;
  }

  async cachedRequest<T>(
    key: string, 
    requestFn: () => Promise<T>, 
    ttl = 2 * 60 * 1000
  ): Promise<T> {
    return this.cache.getOrSet(key, requestFn, ttl);
  }

  invalidateAPI(pattern: string): void {
    this.cache.invalidatePattern(new RegExp(pattern));
  }
}

export const apiCache = APICache.getInstance();