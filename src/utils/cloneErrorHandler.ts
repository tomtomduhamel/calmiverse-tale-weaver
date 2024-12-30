import { isObjectClonable, handleSpecialTypes } from './serializationUtils';
import { ERROR_CONFIG } from './errorConfig';

class CloneErrorHandler {
  private errorCache: Set<string> = new Set();
  private lastErrorTime: number = 0;

  private shouldIgnoreError(error: Error): boolean {
    return ERROR_CONFIG.ignorePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private cleanupCache(errorKey: string): void {
    setTimeout(() => {
      this.errorCache.delete(errorKey);
    }, ERROR_CONFIG.cacheTimeout);
  }

  public safeSerialize(obj: any, depth: number = 0): any {
    if (!obj) return null;
    
    try {
      if (typeof obj !== 'object') return obj;
      if (isObjectClonable(obj)) return obj;

      const serialized = handleSpecialTypes(obj, depth, ERROR_CONFIG.maxDepth);
      if (serialized !== obj) return serialized;

      if (Array.isArray(obj)) {
        return obj.map(item => this.safeSerialize(item, depth + 1));
      }

      const clean: Record<string, any> = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clean[key] = this.safeSerialize(obj[key], depth + 1);
        }
      }
      return clean;

    } catch (e) {
      return {
        error: 'Serialization failed',
        type: typeof obj,
        preview: String(obj).slice(0, 100)
      };
    }
  }

  public handleError(error: Error, source: string): boolean {
    const now = Date.now();
    const errorKey = `${error.message}:${source}`;

    if (this.shouldIgnoreError(error)) {
      return false;
    }

    if (this.errorCache.has(errorKey) && (now - this.lastErrorTime) < ERROR_CONFIG.cacheTimeout) {
      return false;
    }

    this.lastErrorTime = now;
    this.errorCache.add(errorKey);
    this.cleanupCache(errorKey);

    const serializedError = this.safeSerialize(error);
    console.error(`[${source}] Error:`, serializedError);

    return true;
  }
}

export const cloneErrorHandler = new CloneErrorHandler();