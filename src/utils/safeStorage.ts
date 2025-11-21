/**
 * 🛡️ SAFE STORAGE - Wrapper localStorage avec fallback mémoire
 * Élimine les crashes localStorage en mode preview/iframe
 */

interface MemoryStorage {
  [key: string]: string;
}

class SafeStorage {
  private memoryStorage: MemoryStorage = {};
  private isLocalStorageAvailable: boolean = false;
  private isPreviewMode: boolean = false;

  constructor() {
    // Détecter mode preview
    this.isPreviewMode = this.detectPreviewMode();
    
    // Tester localStorage availability
    this.isLocalStorageAvailable = this.testLocalStorage();
    
    if (!this.isLocalStorageAvailable) {
      console.warn('[SafeStorage] localStorage bloqué - utilisation mémoire uniquement');
    }
    
    if (this.isPreviewMode) {
      console.log('[SafeStorage] Mode preview détecté - stockage mémoire');
    }
  }

  private detectPreviewMode(): boolean {
    try {
      const inIframe = window.self !== window.top;
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      return inIframe && isMobile;
    } catch {
      return true; // Si erreur = probablement en iframe
    }
  }

  private testLocalStorage(): boolean {
    try {
      const testKey = '__calmi_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    // En mode preview, toujours utiliser mémoire
    if (this.isPreviewMode) {
      return this.memoryStorage[key] || null;
    }

    // Sinon, essayer localStorage avec fallback mémoire
    if (this.isLocalStorageAvailable) {
      try {
        return localStorage.getItem(key);
      } catch {
        // Si erreur, marquer localStorage comme indisponible
        this.isLocalStorageAvailable = false;
      }
    }
    
    // Fallback mémoire
    return this.memoryStorage[key] || null;
  }

  setItem(key: string, value: string): boolean {
    // En mode preview, toujours utiliser mémoire
    if (this.isPreviewMode) {
      this.memoryStorage[key] = value;
      return true;
    }

    // Sinon, essayer localStorage avec fallback mémoire
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch {
        this.isLocalStorageAvailable = false;
      }
    }
    
    // Fallback mémoire
    this.memoryStorage[key] = value;
    return false; // Retourne false si pas réellement persisté
  }

  removeItem(key: string): void {
    // En mode preview, toujours utiliser mémoire
    if (this.isPreviewMode) {
      delete this.memoryStorage[key];
      return;
    }

    // Sinon, essayer localStorage avec fallback mémoire
    if (this.isLocalStorageAvailable) {
      try {
        localStorage.removeItem(key);
      } catch {
        this.isLocalStorageAvailable = false;
      }
    }
    
    // Fallback mémoire
    delete this.memoryStorage[key];
  }

  clear(): void {
    this.memoryStorage = {};
    
    if (this.isLocalStorageAvailable && !this.isPreviewMode) {
      try {
        localStorage.clear();
      } catch {
        this.isLocalStorageAvailable = false;
      }
    }
  }

  // Helper pour vérifier si on utilise le vrai localStorage
  isUsingLocalStorage(): boolean {
    return this.isLocalStorageAvailable && !this.isPreviewMode;
  }

  // Helper pour récupérer l'état du storage
  getStorageInfo(): { type: 'localStorage' | 'memory'; isPreviewMode: boolean } {
    return {
      type: this.isUsingLocalStorage() ? 'localStorage' : 'memory',
      isPreviewMode: this.isPreviewMode
    };
  }
}

// SafeSessionStorage - Même protection pour sessionStorage
class SafeSessionStorage {
  private memoryStorage: MemoryStorage = {};
  private isSessionStorageAvailable: boolean = false;
  private isPreviewMode: boolean = false;

  constructor() {
    this.isPreviewMode = this.detectPreviewMode();
    this.isSessionStorageAvailable = this.testSessionStorage();
    
    if (!this.isSessionStorageAvailable) {
      console.warn('[SafeSessionStorage] sessionStorage bloqué - utilisation mémoire uniquement');
    }
    
    if (this.isPreviewMode) {
      console.log('[SafeSessionStorage] Mode preview détecté - stockage mémoire');
    }
  }

  private detectPreviewMode(): boolean {
    try {
      const inIframe = window.self !== window.top;
      const isMobile = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
      return inIframe && isMobile;
    } catch {
      return true;
    }
  }

  private testSessionStorage(): boolean {
    try {
      const testKey = '__calmi_session_test__';
      sessionStorage.setItem(testKey, 'test');
      sessionStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  getItem(key: string): string | null {
    if (this.isPreviewMode) {
      return this.memoryStorage[key] || null;
    }

    if (this.isSessionStorageAvailable) {
      try {
        return sessionStorage.getItem(key);
      } catch {
        this.isSessionStorageAvailable = false;
      }
    }
    
    return this.memoryStorage[key] || null;
  }

  setItem(key: string, value: string): boolean {
    if (this.isPreviewMode) {
      this.memoryStorage[key] = value;
      return true;
    }

    if (this.isSessionStorageAvailable) {
      try {
        sessionStorage.setItem(key, value);
        return true;
      } catch {
        this.isSessionStorageAvailable = false;
      }
    }
    
    this.memoryStorage[key] = value;
    return false;
  }

  removeItem(key: string): void {
    if (this.isPreviewMode) {
      delete this.memoryStorage[key];
      return;
    }

    if (this.isSessionStorageAvailable) {
      try {
        sessionStorage.removeItem(key);
      } catch {
        this.isSessionStorageAvailable = false;
      }
    }
    
    delete this.memoryStorage[key];
  }

  clear(): void {
    this.memoryStorage = {};
    
    if (this.isSessionStorageAvailable && !this.isPreviewMode) {
      try {
        sessionStorage.clear();
      } catch {
        this.isSessionStorageAvailable = false;
      }
    }
  }

  isUsingSessionStorage(): boolean {
    return this.isSessionStorageAvailable && !this.isPreviewMode;
  }
}

// Export singletons
export const safeStorage = new SafeStorage();
export const safeSessionStorage = new SafeSessionStorage();

// Helper functions pour compatibilité
export const safeGetItem = (key: string): string | null => safeStorage.getItem(key);
export const safeSetItem = (key: string, value: string): boolean => safeStorage.setItem(key, value);
export const safeRemoveItem = (key: string): void => safeStorage.removeItem(key);
